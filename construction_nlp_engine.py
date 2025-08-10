"""
Construction NLP Parsing & Entity Extraction Engine

This module implements a comprehensive NLP system for construction scope analysis:
- Fine-tuned DistilBERT model for construction text understanding
- spaCy custom pipeline with EntityRuler and dependency parser
- Integration with construction ontology for entity mapping
- Structured token output aligned with ontology IDs
"""

import json
import re
import logging
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, field
from pathlib import Path
import warnings

# Core ML/NLP imports
import torch
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

# Transformers and tokenization
from transformers import (
    DistilBertTokenizer, DistilBertForTokenClassification,
    TrainingArguments, Trainer, DataCollatorForTokenClassification,
    pipeline, AutoTokenizer, AutoModelForTokenClassification
)
from datasets import Dataset

# spaCy imports
import spacy
from spacy.training import Example
from spacy.util import minibatch, compounding
from spacy.tokens import DocBin
from spacy import displacy
import spacy.util

# Import our construction ontology
from construction_ontology import ConstructionOntology, VocabularyCategory

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EntityExtraction:
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
class ConstructionScopeAnalysis:
    """Complete analysis of a construction scope sentence"""
    original_text: str
    entities: List[EntityExtraction]
    work_type: Optional[str] = None
    operation: Optional[str] = None
    total_quantity: Optional[float] = None
    primary_unit: Optional[str] = None
    materials: List[str] = field(default_factory=list)
    equipment: List[str] = field(default_factory=list)
    modifiers: List[str] = field(default_factory=list)
    confidence_score: float = 0.0


class ConstructionEntityRuler:
    """Custom entity ruler for construction-specific entity recognition"""
    
    def __init__(self, ontology: ConstructionOntology):
        self.ontology = ontology
        self.patterns = self._build_entity_patterns()
    
    def _build_entity_patterns(self) -> List[Dict]:
        """Build spaCy EntityRuler patterns from construction ontology"""
        patterns = []
        
        # Material patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.MATERIAL:
                # Add canonical name pattern
                patterns.append({
                    "label": "MATERIAL",
                    "pattern": term.canonical_name.replace('_', ' '),
                    "id": term_name
                })
                
                # Add synonym patterns
                for synonym in term.synonyms:
                    patterns.append({
                        "label": "MATERIAL",
                        "pattern": synonym.replace('_', ' '),
                        "id": term_name
                    })
                
                # Add abbreviation patterns
                for abbrev in term.abbreviations:
                    patterns.append({
                        "label": "MATERIAL",
                        "pattern": abbrev,
                        "id": term_name
                    })
        
        # Unit patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.UNIT:
                patterns.append({
                    "label": "UNIT",
                    "pattern": term.canonical_name.replace('_', ' '),
                    "id": term_name
                })
                
                for abbrev in term.abbreviations:
                    patterns.append({
                        "label": "UNIT",
                        "pattern": abbrev,
                        "id": term_name
                    })
        
        # Equipment patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.EQUIPMENT:
                patterns.append({
                    "label": "EQUIPMENT",
                    "pattern": term.canonical_name.replace('_', ' '),
                    "id": term_name
                })
                
                for synonym in term.synonyms:
                    patterns.append({
                        "label": "EQUIPMENT",
                        "pattern": synonym.replace('_', ' '),
                        "id": term_name
                    })
        
        # Quantity patterns (regex-based)
        quantity_patterns = [
            {"label": "QUANTITY", "pattern": [{"TEXT": {"REGEX": r"^\d+(\.\d+)?$"}}]},
            {"label": "QUANTITY", "pattern": [{"TEXT": {"REGEX": r"^\d{1,3}(,\d{3})*(\.\d+)?$"}}]},
        ]
        patterns.extend(quantity_patterns)
        
        return patterns


class DistilBERTConstructionNER:
    """DistilBERT-based Named Entity Recognition for Construction Text"""
    
    def __init__(self, model_name: str = "distilbert-base-uncased"):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self.label2id = {}
        self.id2label = {}
        self.is_trained = False
    
    def prepare_labels(self, training_data: List[Dict]) -> None:
        """Prepare label mappings from training data"""
        labels = set()
        for item in training_data:
            for entity in item.get('entities', []):
                labels.add(f"B-{entity['label']}")
                labels.add(f"I-{entity['label']}")
        
        labels.add("O")  # Outside entity
        labels = sorted(list(labels))
        
        self.label2id = {label: idx for idx, label in enumerate(labels)}
        self.id2label = {idx: label for label, idx in self.label2id.items()}
        
        logger.info(f"Prepared {len(labels)} labels: {labels}")
    
    def tokenize_and_align_labels(self, examples: List[Dict]) -> Dict:
        """Tokenize text and align labels for transformer training"""
        tokenized_inputs = self.tokenizer(
            [ex["text"] for ex in examples],
            truncation=True,
            padding=True,
            is_split_into_words=False,
            return_tensors="pt"
        )
        
        labels = []
        for i, example in enumerate(examples):
            word_ids = tokenized_inputs.word_ids(batch_index=i)
            label_ids = []
            
            # Create BIO labels for each token
            tokens_labels = ["O"] * len(example["text"].split())
            
            # Mark entity positions
            for entity in example.get("entities", []):
                start_word = len(example["text"][:entity["start"]].split()) - 1
                end_word = len(example["text"][:entity["end"]].split()) - 1
                
                if start_word < len(tokens_labels):
                    tokens_labels[start_word] = f"B-{entity['label']}"
                    for j in range(start_word + 1, min(end_word + 1, len(tokens_labels))):
                        tokens_labels[j] = f"I-{entity['label']}"
            
            # Align with tokenized sequence
            previous_word_idx = None
            for word_idx in word_ids:
                if word_idx is None:
                    label_ids.append(-100)  # Special tokens
                elif word_idx != previous_word_idx:
                    if word_idx < len(tokens_labels):
                        label_ids.append(self.label2id.get(tokens_labels[word_idx], self.label2id["O"]))
                    else:
                        label_ids.append(self.label2id["O"])
                else:
                    label_ids.append(-100)  # Continuation of previous word
                previous_word_idx = word_idx
            
            labels.append(label_ids)
        
        tokenized_inputs["labels"] = labels
        return tokenized_inputs
    
    def train(self, training_data_file: str, output_dir: str = "./construction_ner_model", 
              test_size: float = 0.2, epochs: int = 3) -> None:
        """Train the DistilBERT model on construction data"""
        
        # Load training data
        with open(training_data_file, 'r') as f:
            data = json.load(f)
        
        training_examples = data['training_data']
        logger.info(f"Loaded {len(training_examples)} training examples")
        
        # Prepare labels
        self.prepare_labels(training_examples)
        
        # Initialize tokenizer and model
        self.tokenizer = DistilBertTokenizer.from_pretrained(self.model_name)
        self.model = DistilBertForTokenClassification.from_pretrained(
            self.model_name,
            num_labels=len(self.label2id),
            id2label=self.id2label,
            label2id=self.label2id
        )
        
        # Split data
        train_data, val_data = train_test_split(
            training_examples, test_size=test_size, random_state=42
        )
        
        # Tokenize data
        train_dataset = Dataset.from_dict(self.tokenize_and_align_labels(train_data))
        val_dataset = Dataset.from_dict(self.tokenize_and_align_labels(val_data))
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=epochs,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir='./logs',
            logging_steps=50,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
        )
        
        # Data collator
        data_collator = DataCollatorForTokenClassification(self.tokenizer)
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            data_collator=data_collator,
        )
        
        # Train
        logger.info("Starting DistilBERT training...")
        trainer.train()
        
        # Save model
        trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        
        # Save label mappings
        with open(f"{output_dir}/label_mappings.json", 'w') as f:
            json.dump({
                "label2id": self.label2id,
                "id2label": self.id2label
            }, f, indent=2)
        
        self.is_trained = True
        logger.info(f"Model training completed and saved to {output_dir}")
    
    def load_trained_model(self, model_dir: str) -> None:
        """Load a pre-trained model"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
            self.model = AutoModelForTokenClassification.from_pretrained(model_dir)
            
            # Load label mappings
            with open(f"{model_dir}/label_mappings.json", 'r') as f:
                mappings = json.load(f)
                self.label2id = mappings["label2id"]
                self.id2label = {int(k): v for k, v in mappings["id2label"].items()}
            
            self.is_trained = True
            logger.info(f"Loaded trained model from {model_dir}")
        except Exception as e:
            logger.error(f"Failed to load model from {model_dir}: {e}")
            raise
    
    def predict(self, text: str) -> List[EntityExtraction]:
        """Predict entities in text using the trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained or loaded before prediction")
        
        # Create pipeline
        nlp = pipeline(
            "ner",
            model=self.model,
            tokenizer=self.tokenizer,
            aggregation_strategy="simple"
        )
        
        # Get predictions
        predictions = nlp(text)
        
        # Convert to EntityExtraction objects
        entities = []
        for pred in predictions:
            entities.append(EntityExtraction(
                start=pred['start'],
                end=pred['end'],
                label=pred['entity_group'],
                text=pred['word'],
                confidence=pred['score']
            ))
        
        return entities


class ConstructionNLPEngine:
    """Main NLP engine combining DistilBERT and spaCy for construction text analysis"""
    
    def __init__(self):
        self.ontology = ConstructionOntology()
        self.bert_model = DistilBERTConstructionNER()
        self.spacy_nlp = None
        self.entity_ruler = None
        self._initialize_spacy_pipeline()
    
    def _initialize_spacy_pipeline(self):
        """Initialize spaCy pipeline with custom components"""
        try:
            # Try to load existing model, otherwise use blank English model
            try:
                self.spacy_nlp = spacy.load("en_core_web_sm")
            except OSError:
                logger.warning("en_core_web_sm not found, using blank English model")
                self.spacy_nlp = spacy.blank("en")
                # Add basic components
                if "tagger" not in self.spacy_nlp.pipe_names:
                    self.spacy_nlp.add_pipe("tagger")
                if "parser" not in self.spacy_nlp.pipe_names:
                    self.spacy_nlp.add_pipe("parser")
            
            # Create entity ruler
            self.entity_ruler = ConstructionEntityRuler(self.ontology)
            
            # Add entity ruler to pipeline
            if "entity_ruler" not in self.spacy_nlp.pipe_names:
                ruler = self.spacy_nlp.add_pipe("entity_ruler", before="ner" if "ner" in self.spacy_nlp.pipe_names else "tagger")
                ruler.add_patterns(self.entity_ruler.patterns)
            
            logger.info("spaCy pipeline initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize spaCy pipeline: {e}")
            # Fallback to basic pipeline
            self.spacy_nlp = spacy.blank("en")
    
    def train_models(self, training_data_file: str = "construction_training_data.json"):
        """Train both DistilBERT and update spaCy models"""
        
        # Train DistilBERT model
        logger.info("Training DistilBERT model...")
        self.bert_model.train(training_data_file)
        
        # Train spaCy NER (optional enhancement)
        logger.info("spaCy entity ruler configured with ontology patterns")
    
    def extract_entities(self, text: str, use_bert: bool = True) -> List[EntityExtraction]:
        """Extract entities using combined BERT + spaCy approach"""
        entities = []
        
        if use_bert and self.bert_model.is_trained:
            # Use BERT for primary entity extraction
            bert_entities = self.bert_model.predict(text)
            entities.extend(bert_entities)
        
        # Use spaCy for additional entity recognition and ontology alignment
        doc = self.spacy_nlp(text)
        
        for ent in doc.ents:
            # Check if this entity overlaps with BERT entities
            overlaps = any(
                (ent.start_char < e.end and ent.end_char > e.start)
                for e in entities
            )
            
            if not overlaps:
                # Add spaCy entity
                entity = EntityExtraction(
                    start=ent.start_char,
                    end=ent.end_char,
                    label=ent.label_,
                    text=ent.text,
                    confidence=0.8,  # Default confidence for rule-based
                )
                
                # Try to get ontology ID
                ontology_term = self.ontology.get_term(ent.text)
                if ontology_term:
                    entity.ontology_id = ontology_term.canonical_name
                    entity.ontology_category = ontology_term.category.value
                    entity.normalized_value = ontology_term.canonical_name
                
                entities.append(entity)
        
        # Additional pattern-based extraction for quantities
        entities.extend(self._extract_quantities(text))
        
        # Sort entities by start position
        entities.sort(key=lambda x: x.start)
        
        return entities
    
    def _extract_quantities(self, text: str) -> List[EntityExtraction]:
        """Extract numeric quantities using regex patterns"""
        entities = []
        
        # Pattern for numbers with optional commas and decimals
        quantity_pattern = r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b'
        
        for match in re.finditer(quantity_pattern, text):
            entities.append(EntityExtraction(
                start=match.start(),
                end=match.end(),
                label="QUANTITY",
                text=match.group(),
                confidence=0.9
            ))
        
        return entities
    
    def analyze_construction_scope(self, text: str) -> ConstructionScopeAnalysis:
        """Perform complete analysis of construction scope text"""
        
        # Extract entities
        entities = self.extract_entities(text)
        
        # Initialize analysis
        analysis = ConstructionScopeAnalysis(
            original_text=text,
            entities=entities
        )
        
        # Determine work type from text and entities
        analysis.work_type = self._determine_work_type(text, entities)
        
        # Extract operation/verb
        analysis.operation = self._extract_operation(text)
        
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
            elif entity.label == "MODIFIER":
                analysis.modifiers.append(entity.text)
        
        # Set primary quantity and unit
        if quantities:
            analysis.total_quantity = quantities[0]  # Take first/primary quantity
        if units:
            analysis.primary_unit = units[0]
        
        # Calculate confidence score
        analysis.confidence_score = self._calculate_confidence_score(entities)
        
        return analysis
    
    def _determine_work_type(self, text: str, entities: List[EntityExtraction]) -> Optional[str]:
        """Determine work type from text analysis"""
        text_lower = text.lower()
        
        # Check for work type keywords
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
    
    def _extract_operation(self, text: str) -> Optional[str]:
        """Extract the main operation/verb from text"""
        doc = self.spacy_nlp(text)
        
        # Look for main verb
        for token in doc:
            if token.pos_ == "VERB" and token.dep_ in ["ROOT", "ccomp", "xcomp"]:
                return token.lemma_
        
        # Fallback to common construction verbs
        operations = ['install', 'pour', 'frame', 'excavate', 'apply', 'set', 'place', 'mount', 'run', 'lay']
        text_lower = text.lower()
        
        for op in operations:
            if op in text_lower:
                return op
        
        return None
    
    def _calculate_confidence_score(self, entities: List[EntityExtraction]) -> float:
        """Calculate overall confidence score for the analysis"""
        if not entities:
            return 0.0
        
        total_confidence = sum(entity.confidence for entity in entities)
        return total_confidence / len(entities)
    
    def export_structured_output(self, analysis: ConstructionScopeAnalysis) -> Dict:
        """Export analysis results in structured format aligned with ontology"""
        
        structured_output = {
            "input_text": analysis.original_text,
            "analysis_metadata": {
                "work_type": analysis.work_type,
                "operation": analysis.operation,
                "confidence_score": analysis.confidence_score,
                "total_quantity": analysis.total_quantity,
                "primary_unit": analysis.primary_unit
            },
            "entities": [],
            "ontology_alignment": {
                "materials": [],
                "equipment": [],
                "units": [],
                "modifiers": analysis.modifiers
            }
        }
        
        # Process entities with ontology alignment
        for entity in analysis.entities:
            entity_dict = {
                "text": entity.text,
                "label": entity.label,
                "start": entity.start,
                "end": entity.end,
                "confidence": entity.confidence
            }
            
            if entity.ontology_id:
                entity_dict["ontology_id"] = entity.ontology_id
                entity_dict["ontology_category"] = entity.ontology_category
                entity_dict["normalized_value"] = entity.normalized_value
                
                # Add to appropriate ontology category
                if entity.label == "MATERIAL":
                    structured_output["ontology_alignment"]["materials"].append({
                        "original": entity.text,
                        "canonical": entity.ontology_id,
                        "category": entity.ontology_category
                    })
                elif entity.label == "EQUIPMENT":
                    structured_output["ontology_alignment"]["equipment"].append({
                        "original": entity.text,
                        "canonical": entity.ontology_id,
                        "category": entity.ontology_category
                    })
                elif entity.label == "UNIT":
                    structured_output["ontology_alignment"]["units"].append({
                        "original": entity.text,
                        "canonical": entity.ontology_id,
                        "category": entity.ontology_category
                    })
            
            structured_output["entities"].append(entity_dict)
        
        return structured_output


def main():
    """Demonstration of the Construction NLP Engine"""
    
    # Initialize the engine
    logger.info("Initializing Construction NLP Engine...")
    nlp_engine = ConstructionNLPEngine()
    
    # Sample construction scope sentences for testing
    test_sentences = [
        "Install 500 linear feet of concrete footing with #4 rebar at 12 inch centers",
        "Excavate 25 cubic yards of soil for foundation using track hoe",
        "Frame 1200 SF of exterior walls using 2x6 lumber at 16 OC spacing",
        "Pour 15 CY of concrete for slab on grade with 4000 PSI strength",
        "Install electrical conduit 200 LF of 3/4 inch EMT for branch circuits"
    ]
    
    logger.info("Testing NLP engine with sample sentences...")
    
    for i, sentence in enumerate(test_sentences):
        logger.info(f"\nAnalyzing sentence {i+1}: {sentence}")
        
        # Perform analysis
        analysis = nlp_engine.analyze_construction_scope(sentence)
        
        # Export structured output
        structured_output = nlp_engine.export_structured_output(analysis)
        
        # Print results
        print(f"\nSentence: {sentence}")
        print(f"Work Type: {analysis.work_type}")
        print(f"Operation: {analysis.operation}")
        print(f"Confidence: {analysis.confidence_score:.2f}")
        print(f"Entities found: {len(analysis.entities)}")
        
        for entity in analysis.entities:
            print(f"  - {entity.label}: '{entity.text}' (confidence: {entity.confidence:.2f})")
            if entity.ontology_id:
                print(f"    Ontology ID: {entity.ontology_id}")
        
        print(f"Materials: {analysis.materials}")
        print(f"Equipment: {analysis.equipment}")
        print(f"Quantity: {analysis.total_quantity} {analysis.primary_unit}")
    
    # Option to train models (commented out for demo)
    train_models = False
    if train_models:
        logger.info("Training models with construction data...")
        nlp_engine.train_models("construction_training_data.json")


if __name__ == "__main__":
    main()
