"""
Construction NLP Model Training Script

This script demonstrates how to train both the DistilBERT transformer model 
and the spaCy custom pipeline for construction entity extraction.

Usage:
    python train_construction_models.py --mode [bert|spacy|both]
"""

import argparse
import logging
import json
from pathlib import Path
from typing import Optional

from construction_nlp_engine import DistilBERTConstructionNER, ConstructionNLPEngine
from spacy_construction_trainer import ConstructionSpacyTrainer
from construction_ontology import ConstructionOntology

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ConstructionModelTrainer:
    """Handles training of both BERT and spaCy models for construction NLP"""
    
    def __init__(self, training_data_file: str = "construction_training_data.json"):
        self.training_data_file = training_data_file
        self.ontology = ConstructionOntology()
        
        # Verify training data exists
        if not Path(training_data_file).exists():
            raise FileNotFoundError(f"Training data file not found: {training_data_file}")
        
        logger.info(f"Initialized trainer with data file: {training_data_file}")
    
    def validate_training_data(self) -> bool:
        """Validate the training data format and content"""
        
        try:
            with open(self.training_data_file, 'r') as f:
                data = json.load(f)
            
            # Check required fields
            required_fields = ['training_data', 'entity_types']
            for field in required_fields:
                if field not in data:
                    logger.error(f"Missing required field: {field}")
                    return False
            
            training_examples = data['training_data']
            logger.info(f"Found {len(training_examples)} training examples")
            
            # Validate training examples
            total_entities = 0
            entity_types = set()
            
            for i, example in enumerate(training_examples):
                if 'text' not in example or 'entities' not in example:
                    logger.error(f"Invalid training example at index {i}")
                    return False
                
                for entity in example['entities']:
                    if not all(key in entity for key in ['start', 'end', 'label', 'value']):
                        logger.error(f"Invalid entity in example {i}: {entity}")
                        return False
                    
                    entity_types.add(entity['label'])
                    total_entities += 1
            
            logger.info(f"Validation successful:")
            logger.info(f"  - Total entities: {total_entities}")
            logger.info(f"  - Entity types: {sorted(entity_types)}")
            logger.info(f"  - Average entities per example: {total_entities/len(training_examples):.1f}")
            
            return True
            
        except Exception as e:
            logger.error(f"Training data validation failed: {e}")
            return False
    
    def train_bert_model(self, 
                        output_dir: str = "./construction_ner_model",
                        epochs: int = 3,
                        test_size: float = 0.2) -> bool:
        """Train the DistilBERT model for construction NER"""
        
        logger.info("🤖 Starting DistilBERT model training...")
        
        try:
            # Initialize BERT trainer
            bert_model = DistilBERTConstructionNER()
            
            # Train the model
            bert_model.train(
                training_data_file=self.training_data_file,
                output_dir=output_dir,
                test_size=test_size,
                epochs=epochs
            )
            
            logger.info(f"✅ DistilBERT training completed successfully!")
            logger.info(f"Model saved to: {output_dir}")
            
            # Test the model with a sample
            sample_text = "Install 500 linear feet of concrete footing with #4 rebar"
            logger.info(f"Testing model with: '{sample_text}'")
            
            entities = bert_model.predict(sample_text)
            logger.info(f"Predicted entities: {len(entities)}")
            for entity in entities:
                logger.info(f"  - {entity.label}: '{entity.text}' (confidence: {entity.confidence:.3f})")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ DistilBERT training failed: {e}")
            return False
    
    def train_spacy_model(self,
                         output_dir: str = "./trained_construction_model",
                         n_iter: int = 30) -> bool:
        """Train the spaCy model with custom EntityRuler"""
        
        logger.info("🧠 Starting spaCy model training...")
        
        try:
            # Initialize spaCy trainer
            trainer = ConstructionSpacyTrainer(self.ontology)
            
            # Prepare training data
            training_data = trainer.prepare_training_data(self.training_data_file)
            
            # Split data for training and testing
            import random
            random.shuffle(training_data)
            split_idx = int(len(training_data) * 0.8)
            train_data = training_data[:split_idx]
            test_data = training_data[split_idx:]
            
            # Train the model
            nlp = trainer.train_ner(train_data, output_dir=output_dir, n_iter=n_iter)
            
            # Evaluate on test data
            if test_data:
                logger.info("Evaluating model on test data...")
                scores = trainer.evaluate_model(test_data)
            
            # Test on sample sentences
            test_sentences = [
                "Install 500 linear feet of concrete footing with rebar",
                "Excavate 25 cubic yards using excavator",
                "Frame walls with 2x6 lumber",
                "Pour concrete slab with 4000 PSI strength"
            ]
            
            trainer.test_model(test_sentences)
            
            logger.info(f"✅ spaCy training completed successfully!")
            logger.info(f"Model saved to: {output_dir}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ spaCy training failed: {e}")
            return False
    
    def create_expanded_training_data(self, output_file: str = "expanded_training_data.json"):
        """Create expanded training data with additional examples"""
        
        logger.info("📝 Generating expanded training data...")
        
        # Load base training data
        with open(self.training_data_file, 'r') as f:
            base_data = json.load(f)
        
        # Generate additional training examples programmatically
        additional_examples = [
            {
                "text": "Place 100 tons of gravel base course for parking lot construction",
                "entities": [
                    {"start": 6, "end": 9, "label": "QUANTITY", "value": "100"},
                    {"start": 10, "end": 14, "label": "UNIT", "value": "tons", "ontology_id": "tons"},
                    {"start": 18, "end": 24, "label": "MATERIAL", "value": "gravel"},
                    {"start": 41, "end": 52, "label": "MODIFIER", "value": "parking lot"}
                ],
                "work_type": "excavation",
                "operation": "place"
            },
            {
                "text": "Mount 12 precast concrete panels using mobile crane",
                "entities": [
                    {"start": 6, "end": 8, "label": "QUANTITY", "value": "12"},
                    {"start": 9, "end": 32, "label": "MATERIAL", "value": "precast concrete panels"},
                    {"start": 39, "end": 51, "label": "EQUIPMENT", "value": "mobile crane", "ontology_id": "crane"}
                ],
                "work_type": "concrete_work",
                "operation": "mount"
            },
            {
                "text": "Install 300 LF of galvanized chain link fence with concrete footings",
                "entities": [
                    {"start": 8, "end": 11, "label": "QUANTITY", "value": "300"},
                    {"start": 12, "end": 14, "label": "UNIT", "value": "LF", "ontology_id": "linear_feet"},
                    {"start": 18, "end": 42, "label": "MATERIAL", "value": "galvanized chain link fence"},
                    {"start": 48, "end": 65, "label": "MODIFIER", "value": "concrete footings"}
                ],
                "work_type": "site_work",
                "operation": "install"
            }
        ]
        
        # Combine with base data
        expanded_data = base_data.copy()
        expanded_data['training_data'].extend(additional_examples)
        
        # Add more additional training sentences
        more_sentences = [
            "Apply waterproofing membrane to basement walls",
            "Grade building pad to finished elevation using bulldozer",
            "Install HVAC ductwork throughout building",
            "Set granite countertops in kitchen area",
            "Mount steel handrails on precast stairs",
            "Install fire suppression sprinkler heads",
            "Apply caulking at all window and door openings",
            "Compact fill material to 95% standard density",
            "Install recessed LED lighting fixtures",
            "Set ceramic tile flooring in bathroom areas"
        ]
        
        expanded_data['additional_training_sentences'].extend(more_sentences)
        
        # Save expanded data
        with open(output_file, 'w') as f:
            json.dump(expanded_data, f, indent=2)
        
        logger.info(f"✅ Expanded training data saved to: {output_file}")
        logger.info(f"Total training examples: {len(expanded_data['training_data'])}")
        logger.info(f"Total additional sentences: {len(expanded_data['additional_training_sentences'])}")
    
    def benchmark_models(self) -> dict:
        """Benchmark the trained models on test data"""
        
        logger.info("🏆 Benchmarking trained models...")
        
        # Test sentences for benchmarking
        test_cases = [
            {
                "text": "Install 400 linear feet of PVC pipe for drainage system",
                "expected_entities": ["QUANTITY", "UNIT", "MATERIAL", "MODIFIER"]
            },
            {
                "text": "Pour 20 cubic yards of concrete for building foundation",
                "expected_entities": ["QUANTITY", "UNIT", "MATERIAL", "MODIFIER"]
            },
            {
                "text": "Frame 800 SF of interior partition walls using metal studs",
                "expected_entities": ["QUANTITY", "UNIT", "MODIFIER", "MATERIAL"]
            }
        ]
        
        results = {
            "test_cases": len(test_cases),
            "spacy_results": [],
            "bert_results": []
        }
        
        # Test spaCy model if available
        spacy_model_path = "./trained_construction_model"
        if Path(spacy_model_path).exists():
            logger.info("Testing spaCy model...")
            # Implementation would load and test spaCy model
            
        # Test BERT model if available  
        bert_model_path = "./construction_ner_model"
        if Path(bert_model_path).exists():
            logger.info("Testing DistilBERT model...")
            # Implementation would load and test BERT model
            
        return results


def main():
    """Main training script entry point"""
    
    parser = argparse.ArgumentParser(description="Train Construction NLP Models")
    parser.add_argument("--mode", choices=["bert", "spacy", "both"], default="both",
                       help="Training mode: bert, spacy, or both")
    parser.add_argument("--data-file", default="construction_training_data.json",
                       help="Training data file path")
    parser.add_argument("--bert-epochs", type=int, default=3,
                       help="Number of epochs for BERT training")
    parser.add_argument("--spacy-iterations", type=int, default=30,
                       help="Number of iterations for spaCy training")
    parser.add_argument("--expand-data", action="store_true",
                       help="Generate expanded training data")
    parser.add_argument("--benchmark", action="store_true",
                       help="Benchmark trained models")
    
    args = parser.parse_args()
    
    try:
        trainer = ConstructionModelTrainer(args.data_file)
        
        # Validate training data
        if not trainer.validate_training_data():
            logger.error("Training data validation failed!")
            return False
        
        # Generate expanded data if requested
        if args.expand_data:
            trainer.create_expanded_training_data()
        
        success = True
        
        # Train models based on mode
        if args.mode in ["bert", "both"]:
            logger.info("🤖 Training DistilBERT model...")
            if not trainer.train_bert_model(epochs=args.bert_epochs):
                success = False
        
        if args.mode in ["spacy", "both"]:
            logger.info("🧠 Training spaCy model...")
            if not trainer.train_spacy_model(n_iter=args.spacy_iterations):
                success = False
        
        # Benchmark if requested
        if args.benchmark and success:
            trainer.benchmark_models()
        
        if success:
            logger.info("🎉 Training completed successfully!")
            logger.info("Models are ready for use in the construction NLP engine.")
        else:
            logger.error("❌ Training failed!")
        
        return success
        
    except Exception as e:
        logger.error(f"Training script failed: {e}")
        return False


if __name__ == "__main__":
    main()
