"""
spaCy Construction NLP Training Module

This module handles training of spaCy models specifically for construction text:
- Custom NER training for construction entities
- EntityRuler configuration with ontology patterns
- Dependency parsing customization for construction syntax
- Model evaluation and validation
"""

import json
import random
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Optional

import spacy
from spacy.training import Example
from spacy.util import minibatch, compounding
from spacy.tokens import DocBin
from spacy import displacy
from spacy.scorer import Scorer

from construction_ontology import ConstructionOntology, VocabularyCategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConstructionSpacyTrainer:
    """Handles training of spaCy models for construction text analysis"""
    
    def __init__(self, ontology: ConstructionOntology):
        self.ontology = ontology
        self.nlp = None
        self.training_data = []
        
    def prepare_training_data(self, training_file: str) -> List[Tuple[str, Dict]]:
        """Convert training data to spaCy format"""
        
        with open(training_file, 'r') as f:
            data = json.load(f)
        
        training_examples = []
        
        for item in data['training_data']:
            text = item['text']
            entities = []
            
            # Convert entity format
            for ent in item.get('entities', []):
                entities.append((ent['start'], ent['end'], ent['label']))
            
            # Create spaCy training format
            training_examples.append((text, {"entities": entities}))
        
        # Add additional sentences with empty annotations (for negative examples)
        for sentence in data.get('additional_training_sentences', []):
            training_examples.append((sentence, {"entities": []}))
        
        logger.info(f"Prepared {len(training_examples)} training examples")
        return training_examples
    
    def create_blank_model(self, language: str = "en") -> spacy.Language:
        """Create a blank spaCy model with required components"""
        
        # Create blank model
        nlp = spacy.blank(language)
        
        # Add pipeline components
        nlp.add_pipe("tok2vec")
        nlp.add_pipe("tagger")
        nlp.add_pipe("parser")
        nlp.add_pipe("ner")
        
        return nlp
    
    def add_entity_ruler(self, nlp: spacy.Language) -> spacy.Language:
        """Add EntityRuler with construction ontology patterns"""
        
        # Create entity ruler patterns
        patterns = []
        
        # Add material patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.MATERIAL:
                # Canonical name
                patterns.append({
                    "label": "MATERIAL",
                    "pattern": term.canonical_name.replace('_', ' ')
                })
                
                # Synonyms
                for synonym in term.synonyms:
                    patterns.append({
                        "label": "MATERIAL", 
                        "pattern": synonym.replace('_', ' ')
                    })
                
                # Abbreviations - as exact tokens
                for abbrev in term.abbreviations:
                    patterns.append({
                        "label": "MATERIAL",
                        "pattern": [{"TEXT": abbrev}]
                    })
        
        # Add unit patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.UNIT:
                # Canonical name
                patterns.append({
                    "label": "UNIT",
                    "pattern": term.canonical_name.replace('_', ' ')
                })
                
                # Abbreviations
                for abbrev in term.abbreviations:
                    patterns.append({
                        "label": "UNIT",
                        "pattern": [{"TEXT": abbrev}]
                    })
        
        # Add equipment patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.EQUIPMENT:
                patterns.append({
                    "label": "EQUIPMENT",
                    "pattern": term.canonical_name.replace('_', ' ')
                })
                
                for synonym in term.synonyms:
                    patterns.append({
                        "label": "EQUIPMENT",
                        "pattern": synonym.replace('_', ' ')
                    })
        
        # Add crew type patterns
        for term_name, term in self.ontology.vocabulary.items():
            if term.category == VocabularyCategory.CREW_TYPE:
                patterns.append({
                    "label": "CREW_TYPE",
                    "pattern": term.canonical_name.replace('_', ' ')
                })
        
        # Add quantity patterns
        quantity_patterns = [
            {"label": "QUANTITY", "pattern": [{"IS_DIGIT": True}]},
            {"label": "QUANTITY", "pattern": [{"TEXT": {"REGEX": r"^\d+\.\d+$"}}]},
            {"label": "QUANTITY", "pattern": [{"TEXT": {"REGEX": r"^\d{1,3}(,\d{3})*$"}}]},
        ]
        patterns.extend(quantity_patterns)
        
        # Add the entity ruler
        ruler = nlp.add_pipe("entity_ruler", before="ner")
        ruler.add_patterns(patterns)
        
        logger.info(f"Added {len(patterns)} entity ruler patterns")
        return nlp
    
    def train_ner(self, training_data: List[Tuple[str, Dict]], 
                  output_dir: str = "./trained_construction_model",
                  n_iter: int = 30) -> spacy.Language:
        """Train the NER component on construction data"""
        
        # Create or load model
        if self.nlp is None:
            self.nlp = self.create_blank_model()
            self.nlp = self.add_entity_ruler(self.nlp)
        
        # Get the NER component
        ner = self.nlp.get_pipe("ner")
        
        # Add labels to NER
        labels = set()
        for _, annotations in training_data:
            for ent in annotations.get("entities", []):
                labels.add(ent[2])  # Label is at index 2
        
        for label in labels:
            ner.add_label(label)
        
        logger.info(f"Training NER with labels: {sorted(labels)}")
        
        # Prepare training examples
        examples = []
        for text, annotations in training_data:
            doc = self.nlp.make_doc(text)
            example = Example.from_dict(doc, annotations)
            examples.append(example)
        
        # Train the model
        self.nlp.initialize()
        
        # Training loop
        losses = {}
        for iteration in range(n_iter):
            random.shuffle(examples)
            batches = minibatch(examples, size=compounding(4.0, 32.0, 1.001))
            
            for batch in batches:
                self.nlp.update(batch, losses=losses, drop=0.35)
            
            if iteration % 5 == 0:
                logger.info(f"Iteration {iteration}, Losses: {losses}")
        
        # Save the model
        Path(output_dir).mkdir(exist_ok=True)
        self.nlp.to_disk(output_dir)
        logger.info(f"Model saved to {output_dir}")
        
        return self.nlp
    
    def evaluate_model(self, test_data: List[Tuple[str, Dict]]) -> Dict:
        """Evaluate the trained model on test data"""
        
        if self.nlp is None:
            raise ValueError("Model must be trained before evaluation")
        
        examples = []
        for text, annotations in test_data:
            doc = self.nlp.make_doc(text)
            example = Example.from_dict(doc, annotations)
            examples.append(example)
        
        # Score the model
        scorer = Scorer()
        scores = scorer.score(examples)
        
        logger.info("Model Evaluation Results:")
        logger.info(f"Token accuracy: {scores['token_acc']:.3f}")
        logger.info(f"NER precision: {scores['ents_p']:.3f}")
        logger.info(f"NER recall: {scores['ents_r']:.3f}")
        logger.info(f"NER F1: {scores['ents_f']:.3f}")
        
        return scores
    
    def test_model(self, test_sentences: List[str]) -> None:
        """Test the model on sample sentences"""
        
        if self.nlp is None:
            raise ValueError("Model must be trained before testing")
        
        logger.info("Testing model on sample sentences:")
        
        for sentence in test_sentences:
            doc = self.nlp(sentence)
            
            print(f"\nText: {sentence}")
            print("Entities:")
            for ent in doc.ents:
                print(f"  {ent.label_}: '{ent.text}' ({ent.start_char}-{ent.end_char})")
            
            # Show dependency parsing
            print("Dependencies:")
            for token in doc:
                if token.dep_ != "punct":
                    print(f"  {token.text} -> {token.dep_} -> {token.head.text}")
    
    def create_training_corpus(self, training_file: str, output_dir: str = "./corpus"):
        """Create spaCy training corpus files"""
        
        training_data = self.prepare_training_data(training_file)
        
        # Split into train/dev
        random.shuffle(training_data)
        split_idx = int(len(training_data) * 0.8)
        train_data = training_data[:split_idx]
        dev_data = training_data[split_idx:]
        
        # Create DocBin objects
        train_docbin = DocBin()
        dev_docbin = DocBin()
        
        # Create temporary nlp for processing
        nlp = spacy.blank("en")
        
        # Process training data
        for text, annotations in train_data:
            doc = nlp.make_doc(text)
            example = Example.from_dict(doc, annotations)
            train_docbin.add(example.reference)
        
        # Process dev data
        for text, annotations in dev_data:
            doc = nlp.make_doc(text)
            example = Example.from_dict(doc, annotations)
            dev_docbin.add(example.reference)
        
        # Save corpus files
        Path(output_dir).mkdir(exist_ok=True)
        train_docbin.to_disk(f"{output_dir}/train.spacy")
        dev_docbin.to_disk(f"{output_dir}/dev.spacy")
        
        logger.info(f"Training corpus saved to {output_dir}")
        logger.info(f"Training examples: {len(train_data)}")
        logger.info(f"Dev examples: {len(dev_data)}")
    
    def create_config_file(self, output_path: str = "./config.cfg"):
        """Create spaCy training configuration file"""
        
        config_template = """
[system]
gpu_allocator = null
seed = 0

[nlp]
lang = "en"
pipeline = ["tok2vec","tagger","parser","ner","entity_ruler"]
batch_size = 1000
disabled = []
before_creation = null
after_creation = null
after_pipeline_creation = null
tokenizer = {"@tokenizers":"spacy.Tokenizer.v1"}

[components]

[components.ner]
factory = "ner"
incorrect_spans_key = null
moves = null
scorer = {"@scorers":"spacy.ner_scorer.v1"}
update_with_oracle_cut_size = 100

[components.ner.model]
@architectures = "spacy.TransitionBasedParser.v2"
state_type = "ner"
extra_state_tokens = false
hidden_width = 64
maxout_pieces = 2
use_upper = false
nO = null

[components.ner.model.tok2vec]
@architectures = "spacy.Tok2VecListener.v1"
width = ${components.tok2vec.model.encode.width}
upstream = "*"

[components.tok2vec]
factory = "tok2vec"

[components.tok2vec.model]
@architectures = "spacy.Tok2Vec.v2"

[components.tok2vec.model.embed]
@architectures = "spacy.MultiHashEmbed.v2"
width = ${components.tok2vec.model.encode.width}
attrs = ["NORM","PREFIX","SUFFIX","SHAPE"]
rows = [5000,1000,2500,2500]
include_static_vectors = false

[components.tok2vec.model.encode]
@architectures = "spacy.MaxoutWindowEncoder.v2"
width = 96
depth = 4
window_size = 1
maxout_pieces = 3

[components.tagger]
factory = "tagger"
neg_prefix = "!"
overwrite = false
scorer = {"@scorers":"spacy.tagger_scorer.v1"}

[components.tagger.model]
@architectures = "spacy.Tagger.v2"
nO = null
normalize = false

[components.tagger.model.tok2vec]
@architectures = "spacy.Tok2VecListener.v1"
width = ${components.tok2vec.model.encode.width}
upstream = "*"

[components.parser]
factory = "parser"
learn_tokens = false
min_action_freq = 1
moves = null
scorer = {"@scorers":"spacy.parser_scorer.v1"}
update_with_oracle_cut_size = 100

[components.parser.model]
@architectures = "spacy.TransitionBasedParser.v2"
state_type = "parser"
extra_state_tokens = false
hidden_width = 128
maxout_pieces = 3
use_upper = false
nO = null

[components.parser.model.tok2vec]
@architectures = "spacy.Tok2VecListener.v1"
width = ${components.tok2vec.model.encode.width}
upstream = "*"

[components.entity_ruler]
factory = "entity_ruler"
ent_id_sep = "||"
overwrite_ents = true
validate = false

[corpora]

[corpora.dev]
@readers = "spacy.Corpus.v1"
path = ${paths.dev}
max_length = 0
gold_preproc = false
limit = 0
augmenter = null

[corpora.train]
@readers = "spacy.Corpus.v1"
path = ${paths.train}
max_length = 0
gold_preproc = false
limit = 0
augmenter = null

[training]
dev_corpus = "corpora.dev"
train_corpus = "corpora.train"
seed = ${system.seed}
gpu_allocator = ${system.gpu_allocator}
dropout = 0.1
accumulate_gradient = 3
patience = 1600
max_epochs = 0
max_steps = 20000
eval_frequency = 200
frozen_components = []
annotating_components = []
before_to_disk = null

[training.batcher]
@batchers = "spacy.batch_by_words.v1"
discard_oversize = false
tolerance = 0.2
get_length = null

[training.batcher.size]
@schedules = "compounding.v1"
start = 100
stop = 1000
compound = 1.001
t = 0.0

[training.logger]
@loggers = "spacy.ConsoleLogger.v1"
progress_bar = false

[training.optimizer]
@optimizers = "Adam.v1"
beta1 = 0.9
beta2 = 0.999
L2_is_weight_decay = true
L2 = 0.01
grad_clip = 1.0
use_averages = false
eps = 0.00000001
learn_rate = 0.001

[training.score_weights]
ents_f = 1.0
ents_p = 0.0
ents_r = 0.0
ents_per_type = null

[pretraining]

[initialize]
vectors = ${paths.vectors}
init_tok2vec = ${paths.init_tok2vec}
vocab_data = null
lookups = null
before_init = null
after_init = null

[initialize.components]

[initialize.tokenizer]

[paths]
train = "./corpus/train.spacy"
dev = "./corpus/dev.spacy"
vectors = null
init_tok2vec = null

[nlp.tokenizer]
@tokenizers = "spacy.Tokenizer.v1"
"""
        
        with open(output_path, 'w') as f:
            f.write(config_template.strip())
        
        logger.info(f"Configuration file saved to {output_path}")


def main():
    """Demonstration of spaCy training for construction NER"""
    
    # Initialize ontology and trainer
    ontology = ConstructionOntology()
    trainer = ConstructionSpacyTrainer(ontology)
    
    # Prepare training data
    training_data = trainer.prepare_training_data("construction_training_data.json")
    
    # Split data
    random.shuffle(training_data)
    split_idx = int(len(training_data) * 0.8)
    train_data = training_data[:split_idx]
    test_data = training_data[split_idx:]
    
    # Train the model
    logger.info("Training spaCy model...")
    nlp = trainer.train_ner(train_data, n_iter=20)
    
    # Evaluate the model
    if test_data:
        trainer.evaluate_model(test_data)
    
    # Test on sample sentences
    test_sentences = [
        "Install 500 linear feet of concrete footing with rebar",
        "Excavate 25 cubic yards using excavator",
        "Frame walls with 2x6 lumber",
        "Pour concrete slab with 4000 PSI strength"
    ]
    
    trainer.test_model(test_sentences)
    
    # Create corpus files for future training
    trainer.create_training_corpus("construction_training_data.json")
    trainer.create_config_file()
    
    logger.info("spaCy training complete!")


if __name__ == "__main__":
    main()
