"""
Construction NLP Engine - Lightweight Demo

This demonstration script shows the NLP parsing and entity extraction system
without requiring heavy ML dependencies. It focuses on the spaCy rule-based
approach and ontology integration.
"""

import json
import re
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field

# Import the construction ontology
from construction_ontology import ConstructionOntology, VocabularyCategory

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@dataclass 
class LightweightEntityExtraction:
    """Represents an extracted entity with ontology alignment"""
    start: int
    end: int
    label: str
    text: str
    confidence: float
    ontology_id: Optional[str] = None
    ontology_category: Optional[str] = None
    normalized_value: Optional[str] = None


@dataclass
class LightweightScopeAnalysis:
    """Complete analysis of a construction scope sentence"""
    original_text: str
    entities: List[LightweightEntityExtraction]
    work_type: Optional[str] = None
    operation: Optional[str] = None
    total_quantity: Optional[float] = None
    primary_unit: Optional[str] = None
    materials: List[str] = field(default_factory=list)
    equipment: List[str] = field(default_factory=list)
    modifiers: List[str] = field(default_factory=list)
    confidence_score: float = 0.0


class LightweightConstructionNLP:
    """Lightweight NLP engine using rule-based approach with ontology integration"""
    
    def __init__(self):
        self.ontology = ConstructionOntology()
        self.patterns = self._build_patterns()
        
    def _build_patterns(self) -> Dict[str, List[str]]:
        """Build regex patterns for entity extraction"""
        patterns = {
            'quantity': [
                r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b',  # Numbers with commas
                r'\b\d+\.\d+\b',  # Decimal numbers
                r'\b\d+\b'  # Integer numbers
            ],
            'unit': [],
            'material': [],
            'equipment': [],
            'operation': [
                r'\b(?:install|pour|frame|excavate|apply|set|place|mount|run|lay|hang|finish)\b'
            ]
        }
        
        # Add ontology-based patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.UNIT:
                for abbrev in term.abbreviations:
                    patterns['unit'].append(rf'\b{re.escape(abbrev)}\b')
                patterns['unit'].append(rf'\b{re.escape(term.canonical_name.replace("_", " "))}\b')
                
            elif term.category == VocabularyCategory.MATERIAL:
                patterns['material'].append(rf'\b{re.escape(term.canonical_name.replace("_", " "))}\b')
                for synonym in term.synonyms:
                    patterns['material'].append(rf'\b{re.escape(synonym.replace("_", " "))}\b')
                for abbrev in term.abbreviations:
                    patterns['material'].append(rf'\b{re.escape(abbrev)}\b')
                    
            elif term.category == VocabularyCategory.EQUIPMENT:
                patterns['equipment'].append(rf'\b{re.escape(term.canonical_name.replace("_", " "))}\b')
                for synonym in term.synonyms:
                    patterns['equipment'].append(rf'\b{re.escape(synonym.replace("_", " "))}\b')
        
        return patterns
    
    def extract_entities(self, text: str) -> List[LightweightEntityExtraction]:
        """Extract entities using regex patterns and ontology lookup"""
        entities = []
        
        # Extract quantities
        for pattern in self.patterns['quantity']:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entity = LightweightEntityExtraction(
                    start=match.start(),
                    end=match.end(),
                    label="QUANTITY",
                    text=match.group(),
                    confidence=0.9
                )
                entities.append(entity)
        
        # Extract units with ontology alignment
        for pattern in self.patterns['unit']:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entity = LightweightEntityExtraction(
                    start=match.start(),
                    end=match.end(),
                    label="UNIT",
                    text=match.group(),
                    confidence=0.85
                )
                
                # Get ontology information
                ontology_term = self.ontology.get_term(match.group())
                if ontology_term:
                    entity.ontology_id = ontology_term.canonical_name
                    entity.ontology_category = ontology_term.category.value
                    entity.normalized_value = ontology_term.canonical_name
                
                entities.append(entity)
        
        # Extract materials with ontology alignment
        for pattern in self.patterns['material']:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entity = LightweightEntityExtraction(
                    start=match.start(),
                    end=match.end(),
                    label="MATERIAL",
                    text=match.group(),
                    confidence=0.8
                )
                
                # Get ontology information
                ontology_term = self.ontology.get_term(match.group())
                if ontology_term:
                    entity.ontology_id = ontology_term.canonical_name
                    entity.ontology_category = ontology_term.category.value
                    entity.normalized_value = ontology_term.canonical_name
                
                entities.append(entity)
        
        # Extract equipment with ontology alignment
        for pattern in self.patterns['equipment']:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entity = LightweightEntityExtraction(
                    start=match.start(),
                    end=match.end(),
                    label="EQUIPMENT",
                    text=match.group(),
                    confidence=0.8
                )
                
                # Get ontology information
                ontology_term = self.ontology.get_term(match.group())
                if ontology_term:
                    entity.ontology_id = ontology_term.canonical_name
                    entity.ontology_category = ontology_term.category.value
                    entity.normalized_value = ontology_term.canonical_name
                
                entities.append(entity)
        
        # Extract operations
        for pattern in self.patterns['operation']:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                entity = LightweightEntityExtraction(
                    start=match.start(),
                    end=match.end(),
                    label="OPERATION",
                    text=match.group(),
                    confidence=0.9
                )
                entities.append(entity)
        
        # Sort by position and remove overlaps
        entities.sort(key=lambda x: x.start)
        return self._remove_overlaps(entities)
    
    def _remove_overlaps(self, entities: List[LightweightEntityExtraction]) -> List[LightweightEntityExtraction]:
        """Remove overlapping entities, keeping higher confidence ones"""
        if not entities:
            return entities
            
        filtered = [entities[0]]
        
        for entity in entities[1:]:
            # Check for overlap with last entity
            last_entity = filtered[-1]
            if entity.start < last_entity.end:
                # Overlapping - keep the one with higher confidence
                if entity.confidence > last_entity.confidence:
                    filtered[-1] = entity
            else:
                filtered.append(entity)
        
        return filtered
    
    def analyze_construction_scope(self, text: str) -> LightweightScopeAnalysis:
        """Perform complete analysis of construction scope text"""
        
        # Extract entities
        entities = self.extract_entities(text)
        
        # Initialize analysis
        analysis = LightweightScopeAnalysis(
            original_text=text,
            entities=entities
        )
        
        # Determine work type
        analysis.work_type = self._determine_work_type(text)
        
        # Extract operation
        analysis.operation = self._extract_operation(entities)
        
        # Organize entities by type
        quantities = []
        units = []
        
        for entity in entities:
            if entity.label == "QUANTITY":
                try:
                    quantities.append(float(entity.text.replace(',', '')))
                except ValueError:
                    pass
            elif entity.label == "UNIT":
                units.append(entity.text)
            elif entity.label == "MATERIAL":
                analysis.materials.append(entity.text)
            elif entity.label == "EQUIPMENT":
                analysis.equipment.append(entity.text)
        
        # Set primary quantity and unit
        if quantities:
            analysis.total_quantity = quantities[0]
        if units:
            analysis.primary_unit = units[0]
        
        # Calculate confidence score
        if entities:
            analysis.confidence_score = sum(e.confidence for e in entities) / len(entities)
        
        return analysis
    
    def _determine_work_type(self, text: str) -> Optional[str]:
        """Determine work type from text analysis"""
        text_lower = text.lower()
        
        work_type_keywords = {
            'concrete_work': ['concrete', 'pour', 'footing', 'slab', 'foundation'],
            'excavation': ['excavate', 'dig', 'grade', 'trench', 'soil'],
            'framing': ['frame', 'lumber', 'stud', 'joist', 'beam'],
            'electrical': ['electrical', 'wire', 'conduit', 'panel', 'circuit'],
            'plumbing': ['plumbing', 'pipe', 'water', 'drain', 'sewer'],
            'roofing': ['roof', 'shingle', 'membrane', 'flashing'],
            'masonry': ['brick', 'block', 'masonry', 'mortar'],
            'drywall': ['drywall', 'sheetrock', 'gypsum', 'hang', 'tape'],
            'insulation': ['insulation', 'insulate', 'batt', 'foam'],
            'flooring': ['floor', 'flooring', 'tile', 'carpet', 'hardwood']
        }
        
        for work_type, keywords in work_type_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return work_type
        
        return None
    
    def _extract_operation(self, entities: List[LightweightEntityExtraction]) -> Optional[str]:
        """Extract operation from entities"""
        for entity in entities:
            if entity.label == "OPERATION":
                return entity.text.lower()
        return None
    
    def export_structured_output(self, analysis: LightweightScopeAnalysis) -> Dict:
        """Export analysis results in structured format"""
        
        return {
            "input_text": analysis.original_text,
            "analysis_metadata": {
                "work_type": analysis.work_type,
                "operation": analysis.operation,
                "confidence_score": analysis.confidence_score,
                "total_quantity": analysis.total_quantity,
                "primary_unit": analysis.primary_unit
            },
            "entities": [
                {
                    "text": entity.text,
                    "label": entity.label,
                    "start": entity.start,
                    "end": entity.end,
                    "confidence": entity.confidence,
                    "ontology_id": entity.ontology_id,
                    "ontology_category": entity.ontology_category
                }
                for entity in analysis.entities
            ],
            "ontology_alignment": {
                "materials": [{"text": m} for m in analysis.materials],
                "equipment": [{"text": e} for e in analysis.equipment]
            }
        }


def main():
    """Main demonstration"""
    
    logger.info("🏗️  Construction NLP Engine - Lightweight Demo")
    logger.info("=" * 50)
    
    # Initialize the lightweight NLP engine
    nlp_engine = LightweightConstructionNLP()
    
    logger.info(f"✅ Loaded construction ontology with {len(nlp_engine.ontology.vocabulary)} terms")
    
    # Test sentences
    test_sentences = [
        "Install 500 linear feet of concrete footing with #4 rebar at 12 inch centers",
        "Excavate 25 cubic yards of soil for foundation using track hoe", 
        "Frame 1200 SF of exterior walls using 2x6 lumber at 16 OC spacing",
        "Pour 15 CY of concrete for slab on grade with 4000 PSI strength",
        "Install electrical conduit 200 LF of 3/4 inch EMT for branch circuits",
        "Lay 800 concrete masonry units for retaining wall with mortar joints",
        "Hang and finish 2400 SF of 5/8 inch drywall on interior walls",
        "Apply 25 squares of asphalt shingles on sloped roof"
    ]
    
    logger.info(f"\n🔍 Testing {len(test_sentences)} construction sentences:")
    logger.info("-" * 60)
    
    results = []
    
    for i, sentence in enumerate(test_sentences):
        print(f"\n--- Example {i+1} ---")
        print(f"Input: {sentence}")
        
        # Analyze the sentence
        analysis = nlp_engine.analyze_construction_scope(sentence)
        
        # Display results
        print(f"  🎯 Work Type: {analysis.work_type}")
        print(f"  ⚡ Operation: {analysis.operation}")
        print(f"  📊 Confidence: {analysis.confidence_score:.2f}")
        print(f"  📏 Quantity: {analysis.total_quantity} {analysis.primary_unit}")
        
        print(f"  🏷️  Entities ({len(analysis.entities)}):")
        for entity in analysis.entities:
            ontology_info = f" → {entity.ontology_id}" if entity.ontology_id else ""
            print(f"    {entity.label}: '{entity.text}'{ontology_info}")
        
        if analysis.materials:
            print(f"  🧱 Materials: {', '.join(analysis.materials)}")
        if analysis.equipment:
            print(f"  🚜 Equipment: {', '.join(analysis.equipment)}")
        
        # Store structured result
        structured = nlp_engine.export_structured_output(analysis)
        results.append(structured)
    
    # Test ontology integration
    logger.info("\n🗂️  ONTOLOGY INTEGRATION DEMO")
    logger.info("=" * 40)
    
    test_terms = [
        ("LF", "Unit abbreviation"),
        ("CMU", "Material abbreviation"),
        ("concrete", "Material canonical"),
        ("track hoe", "Equipment synonym"),
        ("excavator", "Equipment canonical"),
        ("SF", "Unit abbreviation"),
        ("CY", "Unit abbreviation")
    ]
    
    print("Term Normalization and Ontology Lookup:")
    print("-" * 40)
    
    for term, category in test_terms:
        canonical = nlp_engine.ontology.normalize_term(term)
        vocab_term = nlp_engine.ontology.get_term(term)
        
        if vocab_term:
            print(f"'{term}' ({category})")
            print(f"  → Canonical: {canonical}")
            print(f"  → Category: {vocab_term.category.value}")
            print(f"  → Description: {vocab_term.description}")
        else:
            print(f"'{term}' → Not found in ontology")
    
    # Test unit conversions
    logger.info("\n📐 UNIT CONVERSION DEMO")
    logger.info("=" * 30)
    
    conversions = [
        (100, "linear_feet", "meters"),
        (1000, "square_feet", "square_meters"),
        (25, "cubic_yards", "cubic_feet"),
        (2, "tons", "pounds")
    ]
    
    for value, from_unit, to_unit in conversions:
        result = nlp_engine.ontology.convert_units(value, from_unit, to_unit)
        if result:
            print(f"{value} {from_unit} = {result:.3f} {to_unit}")
        else:
            print(f"{value} {from_unit} → {to_unit}: No conversion available")
    
    # Export results
    output_file = "lightweight_demo_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            "demo_info": {
                "sentences_processed": len(test_sentences),
                "total_entities_found": sum(len(r["entities"]) for r in results),
                "ontology_terms": len(nlp_engine.ontology.vocabulary)
            },
            "results": results
        }, f, indent=2)
    
    logger.info(f"\n✅ Results exported to: {output_file}")
    
    print("\n" + "="*60)
    print("🏗️  CONSTRUCTION NLP ENGINE DEMONSTRATION COMPLETE!")
    print("="*60)
    print("✅ Entity extraction with regex patterns")
    print("✅ Ontology integration and term normalization")
    print("✅ Unit conversion capabilities")
    print("✅ Work type classification")
    print("✅ Structured JSON output")
    print("✅ Rule-based approach (no ML dependencies required)")
    print("\nThe system successfully demonstrates:")
    print("• Processing construction scope sentences")
    print("• Extracting structured data for estimating")
    print("• Ontology-aligned entity recognition")
    print("• Ready for integration with larger systems")


if __name__ == "__main__":
    main()
