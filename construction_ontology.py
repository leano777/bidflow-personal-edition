"""
Construction Ontology and Token-Schema Dictionary
Provides controlled vocabulary for work types, materials, units, crew types, and equipment
with synonym/abbreviation mapping for construction industry terminology.
"""

from typing import Dict, List, Set, Optional, Tuple
import json
from dataclasses import dataclass, field
from enum import Enum


class VocabularyCategory(Enum):
    """Categories for construction vocabulary"""
    WORK_TYPE = "work_type"
    MATERIAL = "material"
    UNIT = "unit"
    CREW_TYPE = "crew_type"
    EQUIPMENT = "equipment"


@dataclass
class VocabularyTerm:
    """Represents a term in the construction vocabulary"""
    canonical_name: str
    category: VocabularyCategory
    description: str
    synonyms: Set[str] = field(default_factory=set)
    abbreviations: Set[str] = field(default_factory=set)
    related_terms: Set[str] = field(default_factory=set)
    unit_conversions: Dict[str, float] = field(default_factory=dict)
    properties: Dict[str, str] = field(default_factory=dict)


class ConstructionOntology:
    """Main ontology system for construction vocabulary and relationships"""
    
    def __init__(self):
        self.vocabulary: Dict[str, VocabularyTerm] = {}
        self.synonym_map: Dict[str, str] = {}  # Maps synonyms/abbrevs to canonical names
        self.category_index: Dict[VocabularyCategory, Set[str]] = {
            cat: set() for cat in VocabularyCategory
        }
        self._initialize_vocabulary()
    
    def _initialize_vocabulary(self):
        """Initialize the construction vocabulary with comprehensive terms"""
        
        # WORK TYPES
        work_types = [
            VocabularyTerm(
                "excavation",
                VocabularyCategory.WORK_TYPE,
                "Earth removal and site preparation work",
                synonyms={"digging", "earth_work", "site_prep"},
                abbreviations={"EXCV", "EXC"},
                related_terms={"grading", "trenching", "backfill"}
            ),
            VocabularyTerm(
                "concrete_work",
                VocabularyCategory.WORK_TYPE,
                "Concrete placement, finishing, and related work",
                synonyms={"concrete_placement", "concrete_pour", "concrete_finishing"},
                abbreviations={"CONC", "CNC"},
                related_terms={"formwork", "reinforcement", "curing"}
            ),
            VocabularyTerm(
                "framing",
                VocabularyCategory.WORK_TYPE,
                "Structural framing including wood and steel",
                synonyms={"rough_carpentry", "structural_framing"},
                abbreviations={"FRAM", "RC"},
                related_terms={"lumber", "fasteners", "structural_engineering"}
            ),
            VocabularyTerm(
                "roofing",
                VocabularyCategory.WORK_TYPE,
                "Roof installation and waterproofing",
                synonyms={"roof_installation", "roof_work"},
                abbreviations={"ROOF", "RF"},
                related_terms={"shingles", "underlayment", "flashing"}
            ),
            VocabularyTerm(
                "electrical",
                VocabularyCategory.WORK_TYPE,
                "Electrical system installation and wiring",
                synonyms={"electrical_work", "wiring"},
                abbreviations={"ELEC", "EL"},
                related_terms={"conduit", "wire", "panel"}
            ),
            VocabularyTerm(
                "plumbing",
                VocabularyCategory.WORK_TYPE,
                "Plumbing system installation",
                synonyms={"plumbing_work", "pipe_work"},
                abbreviations={"PLMB", "PL"},
                related_terms={"pipe", "fittings", "fixtures"}
            ),
            VocabularyTerm(
                "masonry",
                VocabularyCategory.WORK_TYPE,
                "Brick, block, and stone work",
                synonyms={"brick_work", "block_work", "stone_work"},
                abbreviations={"MASN", "MAS"},
                related_terms={"mortar", "brick", "concrete_block"}
            ),
            VocabularyTerm(
                "drywall",
                VocabularyCategory.WORK_TYPE,
                "Drywall installation and finishing",
                synonyms={"gypsum_board", "sheetrock"},
                abbreviations={"DW", "GWB"},
                related_terms={"tape", "mud", "texture"}
            ),
            VocabularyTerm(
                "insulation",
                VocabularyCategory.WORK_TYPE,
                "Thermal and acoustic insulation installation",
                synonyms={"insulation_work"},
                abbreviations={"INSUL", "INS"},
                related_terms={"batt_insulation", "spray_foam", "vapor_barrier"}
            ),
            VocabularyTerm(
                "flooring",
                VocabularyCategory.WORK_TYPE,
                "Floor covering installation",
                synonyms={"floor_installation", "floor_covering"},
                abbreviations={"FLR", "FLRG"},
                related_terms={"underlayment", "adhesive", "transition_strips"}
            )
        ]
        
        # MATERIALS
        materials = [
            VocabularyTerm(
                "concrete",
                VocabularyCategory.MATERIAL,
                "Portland cement concrete",
                synonyms={"cement", "concrete_mix"},
                abbreviations={"CONC", "CNC"},
                related_terms={"aggregate", "cement", "water"},
                properties={"strength": "variable", "curing_time": "28_days"}
            ),
            VocabularyTerm(
                "rebar",
                VocabularyCategory.MATERIAL,
                "Reinforcing steel bar",
                synonyms={"reinforcing_steel", "reinforcement"},
                abbreviations={"RB", "REINF"},
                related_terms={"concrete", "ties", "chairs"}
            ),
            VocabularyTerm(
                "lumber",
                VocabularyCategory.MATERIAL,
                "Dimensional lumber for framing",
                synonyms={"wood", "framing_lumber"},
                abbreviations={"LBR", "WD"},
                related_terms={"nails", "screws", "brackets"}
            ),
            VocabularyTerm(
                "concrete_masonry_unit",
                VocabularyCategory.MATERIAL,
                "Concrete block for masonry construction",
                synonyms={"concrete_block", "cinder_block", "block"},
                abbreviations={"CMU", "BLK"},
                related_terms={"mortar", "grout", "reinforcement"}
            ),
            VocabularyTerm(
                "brick",
                VocabularyCategory.MATERIAL,
                "Clay brick for masonry",
                synonyms={"clay_brick", "face_brick"},
                abbreviations={"BRK", "BR"},
                related_terms={"mortar", "ties", "flashing"}
            ),
            VocabularyTerm(
                "gypsum_board",
                VocabularyCategory.MATERIAL,
                "Drywall panels",
                synonyms={"drywall", "sheetrock", "wallboard"},
                abbreviations={"GWB", "DW"},
                related_terms={"screws", "tape", "compound"}
            ),
            VocabularyTerm(
                "insulation_batt",
                VocabularyCategory.MATERIAL,
                "Fiberglass batt insulation",
                synonyms={"fiberglass_insulation", "batt_insulation"},
                abbreviations={"INSUL", "FG"},
                related_terms={"vapor_barrier", "staples"}
            ),
            VocabularyTerm(
                "roofing_shingle",
                VocabularyCategory.MATERIAL,
                "Asphalt roofing shingles",
                synonyms={"shingles", "roof_shingles"},
                abbreviations={"SHGL", "RS"},
                related_terms={"underlayment", "nails", "ridge_cap"}
            ),
            VocabularyTerm(
                "conduit",
                VocabularyCategory.MATERIAL,
                "Electrical conduit piping",
                synonyms={"electrical_conduit", "pipe"},
                abbreviations={"COND", "EMT"},
                related_terms={"fittings", "wire", "connectors"}
            ),
            VocabularyTerm(
                "pipe",
                VocabularyCategory.MATERIAL,
                "Plumbing pipe",
                synonyms={"plumbing_pipe", "water_pipe"},
                abbreviations={"PP", "PVC"},
                related_terms={"fittings", "joints", "sealant"}
            )
        ]
        
        # UNITS OF MEASURE
        units = [
            VocabularyTerm(
                "linear_feet",
                VocabularyCategory.UNIT,
                "Linear measurement in feet",
                synonyms={"linear_foot", "running_feet", "running_foot"},
                abbreviations={"LF", "LIN FT", "RF"},
                unit_conversions={"inches": 12.0, "yards": 0.333, "meters": 0.3048}
            ),
            VocabularyTerm(
                "square_feet",
                VocabularyCategory.UNIT,
                "Area measurement in square feet",
                synonyms={"square_foot"},
                abbreviations={"SF", "SQ FT", "FT2"},
                unit_conversions={"square_inches": 144.0, "square_yards": 0.111, "square_meters": 0.0929}
            ),
            VocabularyTerm(
                "cubic_feet",
                VocabularyCategory.UNIT,
                "Volume measurement in cubic feet",
                synonyms={"cubic_foot"},
                abbreviations={"CF", "CU FT", "FT3"},
                unit_conversions={"cubic_inches": 1728.0, "cubic_yards": 0.037, "cubic_meters": 0.0283}
            ),
            VocabularyTerm(
                "cubic_yards",
                VocabularyCategory.UNIT,
                "Volume measurement in cubic yards",
                synonyms={"cubic_yard"},
                abbreviations={"CY", "CU YD", "YD3"},
                unit_conversions={"cubic_feet": 27.0, "cubic_meters": 0.765}
            ),
            VocabularyTerm(
                "each",
                VocabularyCategory.UNIT,
                "Individual count unit",
                synonyms={"piece", "item", "unit"},
                abbreviations={"EA", "PC", "PCS"},
                unit_conversions={}
            ),
            VocabularyTerm(
                "tons",
                VocabularyCategory.UNIT,
                "Weight measurement in tons",
                synonyms={"ton"},
                abbreviations={"TON", "T"},
                unit_conversions={"pounds": 2000.0, "kilograms": 907.185}
            ),
            VocabularyTerm(
                "pounds",
                VocabularyCategory.UNIT,
                "Weight measurement in pounds",
                synonyms={"pound"},
                abbreviations={"LB", "LBS", "#"},
                unit_conversions={"tons": 0.0005, "kilograms": 0.453592}
            ),
            VocabularyTerm(
                "gallons",
                VocabularyCategory.UNIT,
                "Volume measurement in gallons",
                synonyms={"gallon"},
                abbreviations={"GAL", "G"},
                unit_conversions={"liters": 3.78541, "cubic_feet": 0.133681}
            ),
            VocabularyTerm(
                "hours",
                VocabularyCategory.UNIT,
                "Time measurement in hours",
                synonyms={"hour", "labor_hours"},
                abbreviations={"HR", "HRS", "LH"},
                unit_conversions={"days": 0.125, "minutes": 60.0}
            ),
            VocabularyTerm(
                "man_hours",
                VocabularyCategory.UNIT,
                "Labor time measurement",
                synonyms={"labor_hours", "person_hours"},
                abbreviations={"MH", "LH"},
                unit_conversions={"hours": 1.0}
            )
        ]
        
        # CREW TYPES
        crew_types = [
            VocabularyTerm(
                "concrete_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in concrete work",
                synonyms={"concrete_team", "cement_crew"},
                abbreviations={"CC", "CONC_CREW"},
                related_terms={"concrete", "formwork", "finishing"}
            ),
            VocabularyTerm(
                "framing_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in structural framing",
                synonyms={"framing_team", "carpentry_crew"},
                abbreviations={"FC", "FRAM_CREW"},
                related_terms={"lumber", "fasteners", "tools"}
            ),
            VocabularyTerm(
                "electrical_crew",
                VocabularyCategory.CREW_TYPE,
                "Licensed electricians",
                synonyms={"electrical_team", "electricians"},
                abbreviations={"EC", "ELEC_CREW"},
                related_terms={"conduit", "wire", "panels"}
            ),
            VocabularyTerm(
                "plumbing_crew",
                VocabularyCategory.CREW_TYPE,
                "Licensed plumbers",
                synonyms={"plumbing_team", "plumbers"},
                abbreviations={"PC", "PLMB_CREW"},
                related_terms={"pipe", "fittings", "fixtures"}
            ),
            VocabularyTerm(
                "masonry_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in masonry work",
                synonyms={"masonry_team", "masons"},
                abbreviations={"MC", "MAS_CREW"},
                related_terms={"brick", "block", "mortar"}
            ),
            VocabularyTerm(
                "drywall_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in drywall installation",
                synonyms={"drywall_team", "taping_crew"},
                abbreviations={"DC", "DW_CREW"},
                related_terms={"gypsum_board", "tape", "compound"}
            ),
            VocabularyTerm(
                "roofing_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in roofing work",
                synonyms={"roofing_team", "roofers"},
                abbreviations={"RC", "ROOF_CREW"},
                related_terms={"shingles", "underlayment", "flashing"}
            ),
            VocabularyTerm(
                "excavation_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in excavation and earthwork",
                synonyms={"excavation_team", "earthwork_crew"},
                abbreviations={"XC", "EXCV_CREW"},
                related_terms={"excavator", "grading", "compaction"}
            ),
            VocabularyTerm(
                "general_laborers",
                VocabularyCategory.CREW_TYPE,
                "General construction laborers",
                synonyms={"laborers", "helpers", "construction_workers"},
                abbreviations={"GL", "LAB"},
                related_terms={"cleanup", "material_handling", "site_prep"}
            ),
            VocabularyTerm(
                "finish_crew",
                VocabularyCategory.CREW_TYPE,
                "Crew specializing in finish work",
                synonyms={"finish_team", "trim_crew"},
                abbreviations={"FN", "FINISH_CREW"},
                related_terms={"trim", "paint", "flooring"}
            )
        ]
        
        # EQUIPMENT
        equipment = [
            VocabularyTerm(
                "excavator",
                VocabularyCategory.EQUIPMENT,
                "Tracked excavating machine",
                synonyms={"track_hoe", "digger"},
                abbreviations={"EXC", "EXCV"},
                related_terms={"bucket", "tracks", "hydraulics"}
            ),
            VocabularyTerm(
                "bulldozer",
                VocabularyCategory.EQUIPMENT,
                "Tracked earthmoving machine with blade",
                synonyms={"dozer", "track_dozer"},
                abbreviations={"BULL", "DOZ"},
                related_terms={"blade", "ripper", "tracks"}
            ),
            VocabularyTerm(
                "concrete_mixer",
                VocabularyCategory.EQUIPMENT,
                "Truck-mounted concrete mixing drum",
                synonyms={"ready_mix_truck", "cement_truck"},
                abbreviations={"MX", "RMT"},
                related_terms={"chute", "drum", "concrete"}
            ),
            VocabularyTerm(
                "crane",
                VocabularyCategory.EQUIPMENT,
                "Mobile lifting equipment",
                synonyms={"mobile_crane", "lifting_crane"},
                abbreviations={"CR", "CRN"},
                related_terms={"boom", "hook", "outriggers"}
            ),
            VocabularyTerm(
                "compactor",
                VocabularyCategory.EQUIPMENT,
                "Soil and asphalt compacting equipment",
                synonyms={"roller", "vibrating_compactor"},
                abbreviations={"COMP", "ROLL"},
                related_terms={"vibration", "drum", "compaction"}
            ),
            VocabularyTerm(
                "forklift",
                VocabularyCategory.EQUIPMENT,
                "Material handling lift truck",
                synonyms={"lift_truck", "fork_truck"},
                abbreviations={"FL", "LIFT"},
                related_terms={"forks", "mast", "material_handling"}
            ),
            VocabularyTerm(
                "skid_steer",
                VocabularyCategory.EQUIPMENT,
                "Compact wheeled loader",
                synonyms={"skid_loader", "bobcat"},
                abbreviations={"SS", "SKID"},
                related_terms={"bucket", "attachment", "compact"}
            ),
            VocabularyTerm(
                "dump_truck",
                VocabularyCategory.EQUIPMENT,
                "Truck with hydraulic dump bed",
                synonyms={"dumper", "tipper_truck"},
                abbreviations={"DT", "DUMP"},
                related_terms={"bed", "hydraulics", "hauling"}
            ),
            VocabularyTerm(
                "generator",
                VocabularyCategory.EQUIPMENT,
                "Portable electrical power generator",
                synonyms={"portable_generator", "genset"},
                abbreviations={"GEN", "GENR"},
                related_terms={"fuel", "power", "electrical"}
            ),
            VocabularyTerm(
                "scaffold",
                VocabularyCategory.EQUIPMENT,
                "Temporary work platform structure",
                synonyms={"scaffolding", "work_platform"},
                abbreviations={"SCAF", "PLAT"},
                related_terms={"planks", "frames", "safety"}
            )
        ]
        
        # Add all terms to vocabulary
        all_terms = work_types + materials + units + crew_types + equipment
        for term in all_terms:
            self.add_term(term)
    
    def add_term(self, term: VocabularyTerm):
        """Add a term to the vocabulary"""
        self.vocabulary[term.canonical_name] = term
        self.category_index[term.category].add(term.canonical_name)
        
        # Map synonyms and abbreviations to canonical name
        for synonym in term.synonyms:
            self.synonym_map[synonym.lower()] = term.canonical_name
        for abbrev in term.abbreviations:
            self.synonym_map[abbrev.lower()] = term.canonical_name
        
        # Also map the canonical name to itself
        self.synonym_map[term.canonical_name.lower()] = term.canonical_name
    
    def normalize_term(self, input_term: str) -> Optional[str]:
        """Convert input term to canonical form"""
        normalized = input_term.lower().replace(' ', '_')
        return self.synonym_map.get(normalized)
    
    def get_term(self, term: str) -> Optional[VocabularyTerm]:
        """Get vocabulary term by name or synonym"""
        canonical = self.normalize_term(term)
        if canonical:
            return self.vocabulary.get(canonical)
        return None
    
    def get_terms_by_category(self, category: VocabularyCategory) -> List[VocabularyTerm]:
        """Get all terms in a specific category"""
        return [self.vocabulary[name] for name in self.category_index[category]]
    
    def find_related_terms(self, term: str) -> Set[str]:
        """Find terms related to the given term"""
        vocab_term = self.get_term(term)
        if vocab_term:
            return vocab_term.related_terms
        return set()
    
    def convert_units(self, value: float, from_unit: str, to_unit: str) -> Optional[float]:
        """Convert between units if conversion is available"""
        from_term = self.get_term(from_unit)
        
        if from_term:
            # Try direct unit name match first
            if to_unit in from_term.unit_conversions:
                return value * from_term.unit_conversions[to_unit]
            
            # Try normalized unit name
            to_canonical = self.normalize_term(to_unit)
            if to_canonical and to_canonical in from_term.unit_conversions:
                return value * from_term.unit_conversions[to_canonical]
        
        return None
    
    def export_vocabulary(self) -> Dict:
        """Export vocabulary to dictionary format"""
        export_data = {}
        for category in VocabularyCategory:
            export_data[category.value] = {}
            for term_name in self.category_index[category]:
                term = self.vocabulary[term_name]
                export_data[category.value][term_name] = {
                    'description': term.description,
                    'synonyms': list(term.synonyms),
                    'abbreviations': list(term.abbreviations),
                    'related_terms': list(term.related_terms),
                    'unit_conversions': term.unit_conversions,
                    'properties': term.properties
                }
        return export_data
    
    def save_to_json(self, filename: str):
        """Save vocabulary to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.export_vocabulary(), f, indent=2)
    
    def load_from_json(self, filename: str):
        """Load vocabulary from JSON file"""
        with open(filename, 'r') as f:
            data = json.load(f)
        
        for category_name, terms_data in data.items():
            category = VocabularyCategory(category_name)
            for term_name, term_data in terms_data.items():
                term = VocabularyTerm(
                    canonical_name=term_name,
                    category=category,
                    description=term_data['description'],
                    synonyms=set(term_data.get('synonyms', [])),
                    abbreviations=set(term_data.get('abbreviations', [])),
                    related_terms=set(term_data.get('related_terms', [])),
                    unit_conversions=term_data.get('unit_conversions', {}),
                    properties=term_data.get('properties', {})
                )
                self.add_term(term)


if __name__ == "__main__":
    # Demo usage
    ontology = ConstructionOntology()
    
    # Test term normalization
    print("Testing term normalization:")
    test_terms = ["LF", "CMU", "concrete block", "rebar", "SF", "concrete crew"]
    for term in test_terms:
        normalized = ontology.normalize_term(term)
        vocab_term = ontology.get_term(term)
        print(f"'{term}' -> '{normalized}' -> {vocab_term.description if vocab_term else 'Not found'}")
    
    # Test unit conversion
    print("\nTesting unit conversions:")
    result = ontology.convert_units(100, "linear_feet", "meters")
    print(f"100 Linear Feet = {result} meters")
    result2 = ontology.convert_units(100, "LF", "meters")
    print(f"100 LF = {result2} meters (via abbreviation)")
    
    # Test related terms
    print("\nTesting related terms:")
    related = ontology.find_related_terms("concrete")
    print(f"Related to concrete: {related}")
    
    # Save vocabulary
    ontology.save_to_json("construction_vocabulary.json")
    print("\nVocabulary saved to construction_vocabulary.json")
