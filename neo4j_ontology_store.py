"""
Neo4j Graph Database Integration for Construction Ontology
Stores construction vocabulary and relationships in Neo4j for complex queries
"""

from typing import Dict, List, Optional, Tuple, Any
import json
from neo4j import GraphDatabase
from construction_ontology import ConstructionOntology, VocabularyTerm, VocabularyCategory


class Neo4jOntologyStore:
    """Neo4j database integration for construction ontology"""
    
    def __init__(self, uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "password"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        self.ontology = ConstructionOntology()
    
    def close(self):
        """Close the database connection"""
        self.driver.close()
    
    def clear_database(self):
        """Clear all nodes and relationships from the database"""
        with self.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
    
    def create_constraints(self):
        """Create constraints and indexes for optimal performance"""
        with self.driver.session() as session:
            # Create constraints for unique identifiers
            constraints = [
                "CREATE CONSTRAINT term_name IF NOT EXISTS FOR (t:Term) REQUIRE t.canonical_name IS UNIQUE",
                "CREATE CONSTRAINT category_name IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE",
                "CREATE CONSTRAINT synonym_text IF NOT EXISTS FOR (s:Synonym) REQUIRE s.text IS UNIQUE",
                "CREATE CONSTRAINT abbreviation_text IF NOT EXISTS FOR (a:Abbreviation) REQUIRE a.text IS UNIQUE",
            ]
            
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as e:
                    print(f"Constraint already exists or failed: {e}")
            
            # Create indexes for better query performance
            indexes = [
                "CREATE INDEX term_category IF NOT EXISTS FOR (t:Term) ON (t.category)",
                "CREATE INDEX term_description IF NOT EXISTS FOR (t:Term) ON (t.description)",
                "CREATE TEXT INDEX synonym_search IF NOT EXISTS FOR (s:Synonym) ON (s.text)",
                "CREATE TEXT INDEX abbreviation_search IF NOT EXISTS FOR (a:Abbreviation) ON (a.text)"
            ]
            
            for index in indexes:
                try:
                    session.run(index)
                except Exception as e:
                    print(f"Index already exists or failed: {e}")
    
    def load_ontology_to_neo4j(self):
        """Load the entire construction ontology into Neo4j"""
        self.create_constraints()
        
        with self.driver.session() as session:
            # Create category nodes
            for category in VocabularyCategory:
                session.run(
                    "MERGE (c:Category {name: $name, description: $desc})",
                    name=category.value,
                    desc=f"{category.value.replace('_', ' ').title()} category"
                )
            
            # Create term nodes and relationships
            for term_name, term in self.ontology.vocabulary.items():
                self._create_term_node(session, term)
            
            # Create relationships between related terms
            for term_name, term in self.ontology.vocabulary.items():
                self._create_relationships(session, term)
    
    def _create_term_node(self, session, term: VocabularyTerm):
        """Create a term node with all its properties"""
        # Create the main term node
        session.run("""
            MERGE (t:Term {canonical_name: $name})
            SET t.category = $category,
                t.description = $description,
                t.properties = $properties
        """, 
        name=term.canonical_name,
        category=term.category.value,
        description=term.description,
        properties=json.dumps(term.properties)
        )
        
        # Connect term to category
        session.run("""
            MATCH (t:Term {canonical_name: $term_name})
            MATCH (c:Category {name: $category})
            MERGE (t)-[:BELONGS_TO]->(c)
        """,
        term_name=term.canonical_name,
        category=term.category.value
        )
        
        # Create synonym nodes and relationships
        for synonym in term.synonyms:
            session.run("""
                MERGE (s:Synonym {text: $synonym})
                WITH s
                MATCH (t:Term {canonical_name: $term_name})
                MERGE (s)-[:SYNONYM_OF]->(t)
            """,
            synonym=synonym,
            term_name=term.canonical_name
            )
        
        # Create abbreviation nodes and relationships
        for abbrev in term.abbreviations:
            session.run("""
                MERGE (a:Abbreviation {text: $abbrev})
                WITH a
                MATCH (t:Term {canonical_name: $term_name})
                MERGE (a)-[:ABBREVIATION_OF]->(t)
            """,
            abbrev=abbrev,
            term_name=term.canonical_name
            )
        
        # Create unit conversion relationships
        if term.unit_conversions:
            for to_unit, factor in term.unit_conversions.items():
                session.run("""
                    MATCH (from_term:Term {canonical_name: $from_name})
                    MERGE (to_unit:Unit {name: $to_name})
                    MERGE (from_term)-[:CONVERTS_TO {factor: $factor}]->(to_unit)
                """,
                from_name=term.canonical_name,
                to_name=to_unit,
                factor=factor
                )
    
    def _create_relationships(self, session, term: VocabularyTerm):
        """Create relationships between related terms"""
        for related_term in term.related_terms:
            # Check if the related term exists in our vocabulary
            canonical_related = self.ontology.normalize_term(related_term)
            if canonical_related and canonical_related in self.ontology.vocabulary:
                session.run("""
                    MATCH (t1:Term {canonical_name: $term1})
                    MATCH (t2:Term {canonical_name: $term2})
                    MERGE (t1)-[:RELATED_TO]-(t2)
                """,
                term1=term.canonical_name,
                term2=canonical_related
                )
    
    def find_term_by_input(self, input_text: str) -> Optional[Dict[str, Any]]:
        """Find a term by exact match, synonym, or abbreviation"""
        with self.driver.session() as session:
            # First try exact match on canonical name
            result = session.run("""
                MATCH (t:Term {canonical_name: $input})
                RETURN t.canonical_name as name, t.category as category, t.description as description
            """, input=input_text.lower().replace(' ', '_'))
            
            record = result.single()
            if record:
                return dict(record)
            
            # Try synonym match
            result = session.run("""
                MATCH (s:Synonym {text: $input})-[:SYNONYM_OF]->(t:Term)
                RETURN t.canonical_name as name, t.category as category, t.description as description
            """, input=input_text.lower().replace(' ', '_'))
            
            record = result.single()
            if record:
                return dict(record)
            
            # Try abbreviation match
            result = session.run("""
                MATCH (a:Abbreviation {text: $input})-[:ABBREVIATION_OF]->(t:Term)
                RETURN t.canonical_name as name, t.category as category, t.description as description
            """, input=input_text.upper())
            
            record = result.single()
            return dict(record) if record else None
    
    def get_related_terms(self, term_name: str, max_depth: int = 2) -> List[Dict[str, Any]]:
        """Get terms related to the given term up to specified depth"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (t:Term {canonical_name: $term})-[:RELATED_TO*1..$depth]-(related:Term)
                RETURN DISTINCT related.canonical_name as name, 
                       related.category as category,
                       related.description as description
                ORDER BY related.category, related.canonical_name
            """, term=term_name, depth=max_depth)
            
            return [dict(record) for record in result]
    
    def find_construction_sequence(self, start_work: str, end_work: str) -> List[Dict[str, Any]]:
        """Find possible construction sequence between two work types"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH path = shortestPath(
                    (start:Term {canonical_name: $start_work})-[:RELATED_TO*]-(end:Term {canonical_name: $end_work})
                )
                WHERE start.category = 'work_type' AND end.category = 'work_type'
                RETURN [node in nodes(path) | {
                    name: node.canonical_name,
                    category: node.category,
                    description: node.description
                }] as sequence
            """, start_work=start_work, end_work=end_work)
            
            record = result.single()
            return record["sequence"] if record else []
    
    def get_materials_for_work_type(self, work_type: str) -> List[Dict[str, Any]]:
        """Get materials commonly used for a specific work type"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (work:Term {canonical_name: $work_type})-[:RELATED_TO]-(material:Term)
                WHERE work.category = 'work_type' AND material.category = 'material'
                RETURN material.canonical_name as name,
                       material.description as description
                ORDER BY material.canonical_name
            """, work_type=work_type)
            
            return [dict(record) for record in result]
    
    def get_required_crew_and_equipment(self, work_type: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get crew types and equipment needed for a work type"""
        with self.driver.session() as session:
            # Get crew types
            crew_result = session.run("""
                MATCH (work:Term {canonical_name: $work_type})-[:RELATED_TO]-(crew:Term)
                WHERE work.category = 'work_type' AND crew.category = 'crew_type'
                RETURN crew.canonical_name as name, crew.description as description
                ORDER BY crew.canonical_name
            """, work_type=work_type)
            
            # Get equipment
            equipment_result = session.run("""
                MATCH (work:Term {canonical_name: $work_type})-[:RELATED_TO]-(equipment:Term)
                WHERE work.category = 'work_type' AND equipment.category = 'equipment'
                RETURN equipment.canonical_name as name, equipment.description as description
                ORDER BY equipment.canonical_name
            """, work_type=work_type)
            
            return {
                'crews': [dict(record) for record in crew_result],
                'equipment': [dict(record) for record in equipment_result]
            }
    
    def convert_units_via_graph(self, value: float, from_unit: str, to_unit: str) -> Optional[float]:
        """Convert units using graph relationships"""
        with self.driver.session() as session:
            # Direct conversion
            result = session.run("""
                MATCH (from_term:Term {canonical_name: $from_unit})-[r:CONVERTS_TO]->(to_unit:Unit {name: $to_unit})
                RETURN r.factor as factor
            """, from_unit=from_unit, to_unit=to_unit)
            
            record = result.single()
            if record:
                return value * record["factor"]
            
            # Reverse conversion
            result = session.run("""
                MATCH (to_term:Term {canonical_name: $to_unit})-[r:CONVERTS_TO]->(from_unit:Unit {name: $from_unit})
                RETURN r.factor as factor
            """, from_unit=from_unit, to_unit=to_unit)
            
            record = result.single()
            if record:
                return value / record["factor"]
            
            return None
    
    def search_terms_by_description(self, search_text: str) -> List[Dict[str, Any]]:
        """Search for terms by description text"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (t:Term)
                WHERE toLower(t.description) CONTAINS toLower($search_text)
                RETURN t.canonical_name as name,
                       t.category as category,
                       t.description as description
                ORDER BY t.category, t.canonical_name
            """, search_text=search_text)
            
            return [dict(record) for record in result]
    
    def get_category_summary(self) -> Dict[str, int]:
        """Get count of terms in each category"""
        with self.driver.session() as session:
            result = session.run("""
                MATCH (t:Term)
                RETURN t.category as category, count(t) as count
                ORDER BY category
            """)
            
            return {record["category"]: record["count"] for record in result}
    
    def complex_construction_query(self, work_types: List[str]) -> Dict[str, Any]:
        """Complex query to analyze relationships between multiple work types"""
        with self.driver.session() as session:
            work_types_str = str(work_types).replace("'", '"')
            
            result = session.run(f"""
                MATCH (work:Term)
                WHERE work.canonical_name IN {work_types_str} AND work.category = 'work_type'
                
                OPTIONAL MATCH (work)-[:RELATED_TO]-(material:Term)
                WHERE material.category = 'material'
                
                OPTIONAL MATCH (work)-[:RELATED_TO]-(crew:Term)
                WHERE crew.category = 'crew_type'
                
                OPTIONAL MATCH (work)-[:RELATED_TO]-(equipment:Term)
                WHERE equipment.category = 'equipment'
                
                RETURN work.canonical_name as work_type,
                       collect(DISTINCT material.canonical_name) as materials,
                       collect(DISTINCT crew.canonical_name) as crews,
                       collect(DISTINCT equipment.canonical_name) as equipment
                ORDER BY work_type
            """)
            
            return [dict(record) for record in result]


# Usage example and setup script
def setup_construction_ontology_db():
    """Setup and populate the construction ontology database"""
    print("Setting up Construction Ontology in Neo4j...")
    
    # Initialize the Neo4j store
    store = Neo4jOntologyStore()
    
    try:
        # Clear existing data
        print("Clearing existing database...")
        store.clear_database()
        
        # Load the ontology
        print("Loading construction ontology...")
        store.load_ontology_to_neo4j()
        
        # Test some queries
        print("\n=== Testing Ontology Queries ===")
        
        # Test term lookup
        print("\n1. Term Lookup Tests:")
        test_terms = ["LF", "CMU", "concrete crew", "rebar"]
        for term in test_terms:
            result = store.find_term_by_input(term)
            if result:
                print(f"  '{term}' -> {result['name']}: {result['description']}")
            else:
                print(f"  '{term}' -> Not found")
        
        # Test related terms
        print("\n2. Related Terms for 'concrete':")
        related = store.get_related_terms("concrete")
        for term in related[:5]:  # Show first 5
            print(f"  - {term['name']}: {term['description']}")
        
        # Test materials for work type
        print("\n3. Materials for 'concrete_work':")
        materials = store.get_materials_for_work_type("concrete_work")
        for material in materials:
            print(f"  - {material['name']}: {material['description']}")
        
        # Test crew and equipment
        print("\n4. Crew and Equipment for 'excavation':")
        resources = store.get_required_crew_and_equipment("excavation")
        print(f"  Crews: {[c['name'] for c in resources['crews']]}")
        print(f"  Equipment: {[e['name'] for e in resources['equipment']]}")
        
        # Test unit conversion
        print("\n5. Unit Conversion Test:")
        conversion = store.convert_units_via_graph(100.0, "linear_feet", "meters")
        print(f"  100 Linear Feet = {conversion} meters")
        
        # Category summary
        print("\n6. Category Summary:")
        summary = store.get_category_summary()
        for category, count in summary.items():
            print(f"  {category}: {count} terms")
        
        print("\n=== Setup Complete ===")
        print("Construction ontology successfully loaded into Neo4j!")
        print("You can now run complex queries like:")
        print("- Wall -> footing -> rebar schedule relationships")
        print("- Material and crew requirements for work types")
        print("- Unit conversions and synonym lookups")
        
    except Exception as e:
        print(f"Error setting up database: {e}")
    finally:
        store.close()


if __name__ == "__main__":
    setup_construction_ontology_db()
