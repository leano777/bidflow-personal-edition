"""
Construction Ontology Demo Script
Demonstrates complex queries for construction relationships like wall -> footing -> rebar schedule
"""

from construction_ontology import ConstructionOntology, VocabularyCategory
from neo4j_ontology_store import Neo4jOntologyStore
import json


class ConstructionQueryDemo:
    """Demonstration of construction ontology queries"""
    
    def __init__(self):
        self.ontology = ConstructionOntology()
        self.neo4j_store = None
    
    def demo_basic_vocabulary(self):
        """Demonstrate basic vocabulary operations"""
        print("=" * 60)
        print("CONSTRUCTION VOCABULARY DEMONSTRATION")
        print("=" * 60)
        
        print("\n1. TERM NORMALIZATION AND SYNONYM MAPPING")
        print("-" * 40)
        
        # Test common construction abbreviations and synonyms
        test_cases = [
            ("LF", "Linear Feet"),
            ("SF", "Square Feet"), 
            ("CMU", "Concrete Masonry Unit"),
            ("CONC", "Concrete"),
            ("RB", "Rebar"),
            ("concrete crew", "Concrete Work Team"),
            ("drywall", "Gypsum Board"),
            ("EXCV", "Excavation"),
            ("ready mix truck", "Concrete Mixer"),
            ("track hoe", "Excavator")
        ]
        
        for input_term, expected_type in test_cases:
            normalized = self.ontology.normalize_term(input_term)
            term = self.ontology.get_term(input_term)
            if term:
                print(f"'{input_term}' -> '{normalized}' ({term.category.value}): {term.description}")
            else:
                print(f"'{input_term}' -> NOT FOUND")
        
        print(f"\nTotal vocabulary size: {len(self.ontology.vocabulary)} terms")
        
        # Show category breakdown
        print("\nTerms by Category:")
        for category in VocabularyCategory:
            terms = self.ontology.get_terms_by_category(category)
            print(f"  {category.value}: {len(terms)} terms")
    
    def demo_unit_conversions(self):
        """Demonstrate unit conversion capabilities"""
        print("\n\n2. UNIT CONVERSION DEMONSTRATIONS")
        print("-" * 40)
        
        conversions = [
            (100, "linear_feet", "meters", "Linear measurement conversion"),
            (500, "square_feet", "square_meters", "Area measurement conversion"),
            (10, "cubic_yards", "cubic_feet", "Volume measurement conversion"),
            (2000, "pounds", "tons", "Weight measurement conversion"),
            (50, "gallons", "liters", "Liquid volume conversion")
        ]
        
        for value, from_unit, to_unit, description in conversions:
            result = self.ontology.convert_units(value, from_unit, to_unit)
            if result:
                print(f"{value} {from_unit} = {result:.3f} {to_unit} ({description})")
            else:
                print(f"Conversion from {from_unit} to {to_unit} not available")
    
    def demo_relationship_queries(self):
        """Demonstrate relationship queries"""
        print("\n\n3. CONSTRUCTION RELATIONSHIP QUERIES")
        print("-" * 40)
        
        # Show relationships for key construction elements
        key_terms = ["concrete", "rebar", "excavation", "framing"]
        
        for term in key_terms:
            related = self.ontology.find_related_terms(term)
            if related:
                print(f"\nTerms related to '{term}':")
                for rel_term in sorted(related):
                    rel_vocab = self.ontology.get_term(rel_term)
                    if rel_vocab:
                        print(f"  - {rel_term} ({rel_vocab.category.value}): {rel_vocab.description}")
    
    def demo_work_type_analysis(self):
        """Analyze work types and their requirements"""
        print("\n\n4. WORK TYPE ANALYSIS")
        print("-" * 40)
        
        work_types = self.ontology.get_terms_by_category(VocabularyCategory.WORK_TYPE)
        
        print("Available Work Types:")
        for work_type in work_types:
            print(f"\n{work_type.canonical_name.upper().replace('_', ' ')}")
            print(f"  Description: {work_type.description}")
            
            if work_type.related_terms:
                print("  Related Terms:")
                for rel_term in sorted(work_type.related_terms):
                    rel_vocab = self.ontology.get_term(rel_term)
                    if rel_vocab:
                        print(f"    - {rel_term} ({rel_vocab.category.value})")
    
    def demo_neo4j_integration(self):
        """Demonstrate Neo4j graph database integration"""
        print("\n\n5. NEO4J GRAPH DATABASE INTEGRATION")
        print("-" * 40)
        
        try:
            # Note: This requires Neo4j to be running
            self.neo4j_store = Neo4jOntologyStore()
            print("Connected to Neo4j database")
            
            # Test complex queries that would be difficult with simple vocabulary
            print("\nTesting complex graph queries...")
            
            # Wall -> Footing -> Rebar schedule type query
            print("\n5.1 Construction Sequence Analysis:")
            try:
                # This is a conceptual example - in practice you'd have more detailed relationships
                sequence = self.neo4j_store.find_construction_sequence("excavation", "concrete_work")
                if sequence:
                    print("Construction sequence from excavation to concrete work:")
                    for i, step in enumerate(sequence):
                        print(f"  {i+1}. {step['name']}: {step['description']}")
                else:
                    print("No direct sequence found - terms may not be fully connected")
            except Exception as e:
                print(f"Sequence query failed: {e}")
            
            # Material requirements for specific work
            print("\n5.2 Material Requirements Analysis:")
            try:
                materials = self.neo4j_store.get_materials_for_work_type("concrete_work")
                if materials:
                    print("Materials required for concrete work:")
                    for material in materials:
                        print(f"  - {material['name']}: {material['description']}")
                else:
                    print("No materials found for concrete work")
            except Exception as e:
                print(f"Material query failed: {e}")
            
            # Resource requirements
            print("\n5.3 Resource Requirements Analysis:")
            try:
                resources = self.neo4j_store.get_required_crew_and_equipment("excavation")
                print("Resources required for excavation:")
                if resources['crews']:
                    print("  Crews:")
                    for crew in resources['crews']:
                        print(f"    - {crew['name']}: {crew['description']}")
                if resources['equipment']:
                    print("  Equipment:")
                    for equip in resources['equipment']:
                        print(f"    - {equip['name']}: {equip['description']}")
            except Exception as e:
                print(f"Resource query failed: {e}")
            
        except Exception as e:
            print(f"Neo4j connection failed: {e}")
            print("Make sure Neo4j is running on localhost:7687")
        finally:
            if self.neo4j_store:
                self.neo4j_store.close()
    
    def demo_practical_applications(self):
        """Show practical applications for construction management"""
        print("\n\n6. PRACTICAL CONSTRUCTION APPLICATIONS")
        print("-" * 40)
        
        print("This ontology system enables:")
        print("\n6.1 ESTIMATING & TAKEOFFS:")
        print("  - Normalize varied input formats (LF, Lin Ft, Linear Feet)")
        print("  - Convert between units automatically")
        print("  - Ensure consistent material naming")
        
        print("\n6.2 PROJECT SCHEDULING:")
        print("  - Identify prerequisite work types")
        print("  - Determine required crews and equipment")
        print("  - Map material dependencies")
        
        print("\n6.3 COST DATABASE INTEGRATION:")
        print("  - Standardize cost item descriptions") 
        print("  - Map regional variations in terminology")
        print("  - Enable cross-project cost comparisons")
        
        print("\n6.4 SPECIFICATION COMPLIANCE:")
        print("  - Validate material specifications")
        print("  - Check work type classifications")
        print("  - Ensure complete scope coverage")
        
        # Example practical query
        print("\n6.5 EXAMPLE: Foundation Work Analysis")
        foundation_terms = ["excavation", "concrete_work", "masonry"]
        
        print("\nFound foundation-related work types:")
        for term_name in foundation_terms:
            term = self.ontology.get_term(term_name)
            if term:
                print(f"\n{term.canonical_name.upper()}:")
                print(f"  Description: {term.description}")
                print(f"  Synonyms: {', '.join(term.synonyms) if term.synonyms else 'None'}")
                print(f"  Abbreviations: {', '.join(term.abbreviations) if term.abbreviations else 'None'}")
                if term.related_terms:
                    related_materials = []
                    related_crews = []
                    for rel_term in term.related_terms:
                        rel_vocab = self.ontology.get_term(rel_term)
                        if rel_vocab:
                            if rel_vocab.category == VocabularyCategory.MATERIAL:
                                related_materials.append(rel_term)
                            elif rel_vocab.category == VocabularyCategory.CREW_TYPE:
                                related_crews.append(rel_term)
                    
                    if related_materials:
                        print(f"  Materials: {', '.join(related_materials)}")
                    if related_crews:
                        print(f"  Crews: {', '.join(related_crews)}")
    
    def save_vocabulary_export(self):
        """Save vocabulary to JSON for external use"""
        print("\n\n7. VOCABULARY EXPORT")
        print("-" * 40)
        
        # Save to JSON
        self.ontology.save_to_json("construction_vocabulary.json")
        print("Vocabulary exported to construction_vocabulary.json")
        
        # Show sample of exported data
        export_data = self.ontology.export_vocabulary()
        print(f"\nExport contains {len(export_data)} categories:")
        for category, terms in export_data.items():
            print(f"  {category}: {len(terms)} terms")
        
        print(f"\nFirst few terms from 'material' category:")
        material_terms = export_data.get('material', {})
        for i, (term_name, term_data) in enumerate(material_terms.items()):
            if i >= 3:  # Show first 3
                break
            print(f"  {term_name}:")
            print(f"    Description: {term_data['description']}")
            print(f"    Abbreviations: {term_data['abbreviations']}")
    
    def run_full_demo(self):
        """Run the complete demonstration"""
        print("CONSTRUCTION ONTOLOGY & TOKEN-SCHEMA DICTIONARY")
        print("Elite SD Construction - BLDR Projects")
        print("=" * 80)
        
        self.demo_basic_vocabulary()
        self.demo_unit_conversions()
        self.demo_relationship_queries()
        self.demo_work_type_analysis()
        self.demo_neo4j_integration()
        self.demo_practical_applications()
        self.save_vocabulary_export()
        
        print("\n" + "=" * 80)
        print("DEMO COMPLETE")
        print("The construction ontology system is ready for integration")
        print("into your estimating, scheduling, and project management systems.")
        print("=" * 80)


if __name__ == "__main__":
    demo = ConstructionQueryDemo()
    demo.run_full_demo()
