"""
Construction Ontology Standalone Demo Script
Demonstrates the construction vocabulary and relationships without Neo4j dependency
"""

from construction_ontology import ConstructionOntology, VocabularyCategory
import json


class ConstructionOntologyDemo:
    """Demonstration of construction ontology without Neo4j"""
    
    def __init__(self):
        self.ontology = ConstructionOntology()
    
    def run_comprehensive_demo(self):
        """Run comprehensive demonstration of the construction ontology"""
        print("=" * 80)
        print("CONSTRUCTION ONTOLOGY & TOKEN-SCHEMA DICTIONARY")
        print("Elite SD Construction - BLDR Projects")
        print("=" * 80)
        
        self.demo_vocabulary_overview()
        self.demo_abbreviation_mapping()
        self.demo_unit_conversions()
        self.demo_relationship_analysis()
        self.demo_construction_workflows()
        self.demo_practical_applications()
        self.save_and_export()
        
        print("\n" + "=" * 80)
        print("CONSTRUCTION ONTOLOGY SYSTEM READY")
        print("✓ Controlled vocabulary curated")
        print("✓ Synonym and abbreviation mapping implemented")
        print("✓ Relationships defined for construction workflows")
        print("✓ Unit conversion system operational")
        print("✓ Export capabilities for integration")
        print("=" * 80)
    
    def demo_vocabulary_overview(self):
        """Show overview of vocabulary categories and sizes"""
        print("\n📋 VOCABULARY OVERVIEW")
        print("-" * 50)
        
        total_terms = len(self.ontology.vocabulary)
        print(f"Total vocabulary terms: {total_terms}")
        
        print("\nTerms by category:")
        for category in VocabularyCategory:
            terms = self.ontology.get_terms_by_category(category)
            print(f"  {category.value.replace('_', ' ').title()}: {len(terms)} terms")
        
        print(f"\nTotal synonym/abbreviation mappings: {len(self.ontology.synonym_map)}")
    
    def demo_abbreviation_mapping(self):
        """Demonstrate abbreviation and synonym mapping capabilities"""
        print("\n🔤 ABBREVIATION & SYNONYM MAPPING")
        print("-" * 50)
        
        # Test common construction abbreviations
        test_cases = [
            ("LF", "Linear Feet - common measurement abbreviation"),
            ("SF", "Square Feet - area measurement"),
            ("CMU", "Concrete Masonry Unit - standard building block"),
            ("CONC", "Concrete - material abbreviation"),
            ("RB", "Rebar - reinforcing steel"),
            ("EXCV", "Excavation - earthwork abbreviation"),
            ("DW", "Drywall - interior finish"),
            ("PLMB", "Plumbing - MEP trade"),
            ("ELEC", "Electrical - MEP trade"),
            ("ready mix truck", "Concrete Mixer - equipment synonym"),
            ("track hoe", "Excavator - equipment synonym"),
            ("concrete block", "CMU - material synonym"),
            ("sheetrock", "Gypsum Board - material synonym")
        ]
        
        print("Abbreviation/Synonym → Canonical Term:")
        for input_term, description in test_cases:
            normalized = self.ontology.normalize_term(input_term)
            term = self.ontology.get_term(input_term)
            if term:
                print(f"  '{input_term}' → '{normalized}' ({term.category.value})")
                print(f"    {term.description}")
            else:
                print(f"  '{input_term}' → NOT FOUND")
    
    def demo_unit_conversions(self):
        """Show unit conversion capabilities"""
        print("\n📐 UNIT CONVERSION SYSTEM")
        print("-" * 50)
        
        conversions = [
            (100, "linear_feet", "meters", "Length conversion"),
            (100, "LF", "meters", "Via abbreviation"),
            (500, "square_feet", "square_meters", "Area conversion"),
            (10, "cubic_yards", "cubic_feet", "Volume conversion"),
            (2000, "pounds", "tons", "Weight conversion"),
            (50, "gallons", "liters", "Liquid volume"),
            (40, "hours", "days", "Time conversion")
        ]
        
        print("Unit conversions:")
        for value, from_unit, to_unit, description in conversions:
            result = self.ontology.convert_units(value, from_unit, to_unit)
            if result is not None:
                print(f"  {value} {from_unit} = {result:.3f} {to_unit} ({description})")
            else:
                print(f"  {value} {from_unit} → {to_unit}: conversion not available")
    
    def demo_relationship_analysis(self):
        """Analyze relationships between construction terms"""
        print("\n🔗 CONSTRUCTION RELATIONSHIP ANALYSIS")
        print("-" * 50)
        
        # Analyze key construction materials and their relationships
        key_materials = ["concrete", "rebar", "lumber", "concrete_masonry_unit"]
        
        for material in key_materials:
            term = self.ontology.get_term(material)
            if term:
                print(f"\n{material.upper().replace('_', ' ')}:")
                print(f"  Description: {term.description}")
                print(f"  Abbreviations: {', '.join(term.abbreviations) if term.abbreviations else 'None'}")
                
                if term.related_terms:
                    print("  Related terms:")
                    for rel_term in sorted(term.related_terms):
                        rel_vocab = self.ontology.get_term(rel_term)
                        if rel_vocab:
                            print(f"    - {rel_term} ({rel_vocab.category.value})")
                        else:
                            print(f"    - {rel_term} (external reference)")
    
    def demo_construction_workflows(self):
        """Demonstrate construction workflow relationships"""
        print("\n🏗️ CONSTRUCTION WORKFLOW ANALYSIS")
        print("-" * 50)
        
        # Analyze work types and their resource requirements
        work_types = self.ontology.get_terms_by_category(VocabularyCategory.WORK_TYPE)
        
        print("Work types and their resource requirements:")
        for work_type in work_types[:5]:  # Show first 5 for brevity
            print(f"\n{work_type.canonical_name.upper().replace('_', ' ')}:")
            print(f"  Description: {work_type.description}")
            print(f"  Abbreviations: {', '.join(work_type.abbreviations) if work_type.abbreviations else 'None'}")
            
            if work_type.related_terms:
                # Categorize related terms
                materials = []
                crews = []
                equipment = []
                other = []
                
                for rel_term in work_type.related_terms:
                    rel_vocab = self.ontology.get_term(rel_term)
                    if rel_vocab:
                        if rel_vocab.category == VocabularyCategory.MATERIAL:
                            materials.append(rel_term)
                        elif rel_vocab.category == VocabularyCategory.CREW_TYPE:
                            crews.append(rel_term)
                        elif rel_vocab.category == VocabularyCategory.EQUIPMENT:
                            equipment.append(rel_term)
                    else:
                        other.append(rel_term)
                
                if materials:
                    print(f"  Materials: {', '.join(materials)}")
                if crews:
                    print(f"  Crews: {', '.join(crews)}")
                if equipment:
                    print(f"  Equipment: {', '.join(equipment)}")
                if other:
                    print(f"  Other: {', '.join(other)}")
    
    def demo_practical_applications(self):
        """Show practical applications for construction management"""
        print("\n💼 PRACTICAL APPLICATIONS")
        print("-" * 50)
        
        print("This ontology system enables:")
        print("\n1. ESTIMATING & TAKEOFF STANDARDIZATION:")
        print("   • Normalize varied input formats (LF/Lin Ft/Linear Feet)")
        print("   • Automatic unit conversions")
        print("   • Consistent material naming across projects")
        
        print("\n2. PROJECT SCHEDULING OPTIMIZATION:")
        print("   • Identify prerequisite work sequences")
        print("   • Determine crew and equipment requirements")
        print("   • Map material dependencies")
        
        print("\n3. COST DATABASE INTEGRATION:")
        print("   • Standardize cost item descriptions")
        print("   • Handle regional terminology variations")
        print("   • Enable cross-project cost comparisons")
        
        print("\n4. SPECIFICATION COMPLIANCE:")
        print("   • Validate material specifications")
        print("   • Check work type classifications")
        print("   • Ensure complete scope coverage")
        
        # Foundation work example
        print("\n5. EXAMPLE: Foundation Work Package Analysis")
        foundation_work = ["excavation", "concrete_work", "masonry"]
        
        print("\\n   Foundation-related work types found:")
        for work_name in foundation_work:
            work = self.ontology.get_term(work_name)
            if work:
                print(f"\\n   {work.canonical_name.upper()}:")
                print(f"     • {work.description}")
                print(f"     • Synonyms: {', '.join(work.synonyms) if work.synonyms else 'None'}")
                print(f"     • Abbreviations: {', '.join(work.abbreviations) if work.abbreviations else 'None'}")
                
                # Show resource relationships
                if work.related_terms:
                    materials = [term for term in work.related_terms if self.ontology.get_term(term) and self.ontology.get_term(term).category == VocabularyCategory.MATERIAL]
                    if materials:
                        print(f"     • Key materials: {', '.join(materials[:3])}{'...' if len(materials) > 3 else ''}")
    
    def save_and_export(self):
        """Save and export vocabulary data"""
        print("\n💾 VOCABULARY EXPORT")
        print("-" * 50)
        
        # Save to JSON
        self.ontology.save_to_json("construction_vocabulary.json")
        print("✓ Vocabulary exported to construction_vocabulary.json")
        
        # Show export statistics
        export_data = self.ontology.export_vocabulary()
        print(f"✓ Export contains {len(export_data)} categories")
        
        total_exported_terms = sum(len(terms) for terms in export_data.values())
        print(f"✓ Total terms exported: {total_exported_terms}")
        
        # Show sample of exported structure
        print("\nSample export structure (first material):")
        if 'material' in export_data and export_data['material']:
            first_material = next(iter(export_data['material'].items()))
            material_name, material_data = first_material
            print(f"  {material_name}:")
            print(f"    description: {material_data['description']}")
            print(f"    abbreviations: {material_data['abbreviations']}")
            print(f"    related_terms: {material_data['related_terms'][:3]}...")
        
        print("\n✓ Ready for integration into:")
        print("  - Estimating software")
        print("  - Project management systems")  
        print("  - Cost databases")
        print("  - Specification systems")
        print("  - Neo4j graph database (when available)")


if __name__ == "__main__":
    demo = ConstructionOntologyDemo()
    demo.run_comprehensive_demo()
