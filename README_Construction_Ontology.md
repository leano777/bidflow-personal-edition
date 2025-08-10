# Construction Ontology & Token-Schema Dictionary

**Elite SD Construction - BLDR Projects**

A comprehensive construction industry ontology system providing controlled vocabulary, synonym/abbreviation mapping, and relationship modeling for construction work types, materials, units, crew types, and equipment.

## 🎯 Purpose

This system addresses the need for:
- **Controlled vocabulary** for construction terminology
- **Synonym and abbreviation mapping** (e.g., "LF" → linear feet, "CMU" → concrete masonry unit)
- **Relationship modeling** for construction workflows (wall → footing → rebar schedule)
- **Unit conversion** capabilities
- **Graph database integration** with Neo4j

## 📁 System Components

### Core Files
- `construction_ontology.py` - Main ontology system with vocabulary management
- `neo4j_ontology_store.py` - Neo4j graph database integration
- `construction_vocabulary.json` - Exported vocabulary data
- `requirements.txt` - Python dependencies

### Demo Files
- `demo_ontology_standalone.py` - Complete demonstration (runs without Neo4j)
- `demo_construction_queries.py` - Advanced demo with Neo4j queries

### Documentation
- `README_Construction_Ontology.md` - This documentation file

## 🏗️ Vocabulary Coverage

### Categories (50 terms total)
- **Work Types** (10): excavation, concrete_work, framing, roofing, electrical, plumbing, masonry, drywall, insulation, flooring
- **Materials** (10): concrete, rebar, lumber, CMU, brick, gypsum_board, insulation_batt, roofing_shingle, conduit, pipe
- **Units** (10): linear_feet, square_feet, cubic_feet, cubic_yards, each, tons, pounds, gallons, hours, man_hours
- **Crew Types** (10): concrete_crew, framing_crew, electrical_crew, plumbing_crew, masonry_crew, drywall_crew, roofing_crew, excavation_crew, general_laborers, finish_crew
- **Equipment** (10): excavator, bulldozer, concrete_mixer, crane, compactor, forklift, skid_steer, dump_truck, generator, scaffold

### Key Features
- **240+ synonym/abbreviation mappings**
- **Unit conversion factors** for common construction measurements
- **Relationship definitions** between related construction elements
- **Material properties** and specifications

## 🚀 Quick Start

### Basic Usage
```python
from construction_ontology import ConstructionOntology

# Initialize the ontology
ontology = ConstructionOntology()

# Normalize construction terms
canonical = ontology.normalize_term("LF")  # Returns "linear_feet"
canonical = ontology.normalize_term("CMU")  # Returns "concrete_masonry_unit"

# Get term details
term = ontology.get_term("rebar")
print(term.description)  # "Reinforcing steel bar"
print(term.abbreviations)  # {"RB", "REINF"}

# Convert units
result = ontology.convert_units(100, "LF", "meters")  # Returns 30.48

# Find related terms
related = ontology.find_related_terms("concrete")  # Returns {"aggregate", "cement", "water"}
```

### Export Vocabulary
```python
# Save to JSON for external use
ontology.save_to_json("my_vocabulary.json")

# Export structured data
export_data = ontology.export_vocabulary()
```

## 🗄️ Neo4j Integration

### Setup (requires Neo4j installation)
```python
from neo4j_ontology_store import Neo4jOntologyStore

# Initialize Neo4j store
store = Neo4jOntologyStore(uri="bolt://localhost:7687", 
                          user="neo4j", 
                          password="your_password")

# Load ontology into graph database
store.load_ontology_to_neo4j()
```

### Advanced Queries
```python
# Find materials for work type
materials = store.get_materials_for_work_type("concrete_work")

# Get crew and equipment requirements
resources = store.get_required_crew_and_equipment("excavation")

# Find construction sequences
sequence = store.find_construction_sequence("excavation", "concrete_work")

# Unit conversion via graph
converted = store.convert_units_via_graph(100, "linear_feet", "meters")
```

## 📊 Common Abbreviation Mappings

| Input | Canonical Term | Category | Description |
|-------|----------------|----------|-------------|
| LF | linear_feet | unit | Linear measurement in feet |
| SF | square_feet | unit | Area measurement in square feet |
| CMU | concrete_masonry_unit | material | Concrete block for masonry |
| CONC | concrete | material | Portland cement concrete |
| RB | rebar | material | Reinforcing steel bar |
| EXCV | excavator | equipment | Tracked excavating machine |
| DW | gypsum_board | material | Drywall panels |

## 🔄 Unit Conversions

Supported conversions include:
- **Length**: linear_feet ↔ meters, inches, yards
- **Area**: square_feet ↔ square_meters, square_inches, square_yards
- **Volume**: cubic_yards ↔ cubic_feet, cubic_meters
- **Weight**: pounds ↔ tons, kilograms
- **Time**: hours ↔ days, minutes

## 💼 Practical Applications

### 1. Estimating & Takeoffs
- Normalize varied input formats (LF, Lin Ft, Linear Feet)
- Automatic unit conversions between systems
- Consistent material naming across projects
- Validate quantity takeoff units

### 2. Project Scheduling
- Map work type dependencies and sequences
- Identify required crew types and equipment
- Material procurement planning
- Resource allocation optimization

### 3. Cost Database Integration
- Standardize cost item descriptions
- Handle regional terminology variations
- Enable cross-project cost comparisons
- Improve cost database search accuracy

### 4. Specification Compliance
- Validate material specifications against standards
- Check work type classifications
- Ensure complete scope coverage
- Generate specification cross-references

## 🔍 Example: Foundation Work Analysis

```python
# Analyze foundation work package
foundation_terms = ["excavation", "concrete_work", "masonry"]

for work_name in foundation_terms:
    work = ontology.get_term(work_name)
    print(f"{work.canonical_name}: {work.description}")
    
    # Find related materials
    for rel_term in work.related_terms:
        rel_vocab = ontology.get_term(rel_term)
        if rel_vocab and rel_vocab.category == VocabularyCategory.MATERIAL:
            print(f"  Material: {rel_term}")
```

Output demonstrates the relationship chain:
- **Excavation** → requires excavator equipment, excavation_crew
- **Concrete Work** → uses concrete, rebar materials, concrete_crew  
- **Masonry** → uses concrete_masonry_unit, brick materials, masonry_crew

## 📈 System Benefits

### For Project Managers
- **Standardized terminology** across all project documentation
- **Automated unit conversions** reduce calculation errors  
- **Resource planning** through work type relationships
- **Scope validation** ensures nothing is missed

### For Estimators
- **Consistent quantity takeoffs** with normalized units
- **Material standardization** improves cost accuracy
- **Cross-project comparisons** with common vocabulary
- **Automated conversions** between measurement systems

### For Field Teams
- **Clear material specifications** with synonym resolution
- **Equipment requirements** defined by work type
- **Crew assignments** based on work classifications
- **Progress tracking** with standardized work categories

## 🛠️ Installation & Requirements

### Python Dependencies
```
pip install neo4j==5.14.1
pip install python-dateutil==2.8.2
pip install dataclasses-json==0.6.1
```

### Neo4j Setup (Optional)
1. Install Neo4j Desktop or Server
2. Create a new database
3. Note connection URI, username, and password
4. Run `neo4j_ontology_store.py` setup script

### Usage Without Neo4j
The core ontology system works without Neo4j:
```bash
python demo_ontology_standalone.py
```

## 🔮 Future Enhancements

### Vocabulary Expansion
- Add more specialized trade vocabularies
- Include regional terminology variations
- Expand equipment and tool categories
- Add safety and environmental terms

### Advanced Relationships
- Temporal sequences (work order dependencies)
- Spatial relationships (location-based work)
- Quality relationships (specification compliance)
- Cost relationships (pricing dependencies)

### Integration Capabilities
- REST API endpoints for external systems
- Database connectors for major estimating software
- Import/export for industry standard formats
- Real-time vocabulary updates

## 📞 Support & Integration

This construction ontology system is ready for integration into:
- Estimating and takeoff software
- Project management systems
- Cost databases and pricing tools
- Specification and documentation systems
- Enterprise resource planning (ERP) systems

For integration support or vocabulary expansion requests, contact the Elite SD Construction development team.

---

**© 2024 Elite SD Construction - BLDR Projects**  
*Construction Ontology & Token-Schema Dictionary System*
