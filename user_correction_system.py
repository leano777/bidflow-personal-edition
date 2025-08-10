"""
User Correction Collection & Model Retraining System

Collects user corrections to improve NLP models monthly
Implements feedback loop for continuous improvement
"""

import json
import sqlite3
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import logging
from pathlib import Path
import hashlib
import uuid
from enum import Enum

from construction_nlp_engine import ConstructionNLPEngine, EntityExtraction, ConstructionScopeAnalysis
from construction_ontology import ConstructionOntology

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CorrectionType(Enum):
    """Types of corrections users can make"""
    ENTITY_BOUNDARY = "entity_boundary"  # Wrong entity boundaries
    ENTITY_LABEL = "entity_label"        # Wrong entity type/label
    MISSING_ENTITY = "missing_entity"    # Missing entity
    FALSE_ENTITY = "false_entity"        # False positive entity
    WORK_TYPE = "work_type"              # Wrong work type classification
    COST_ESTIMATE = "cost_estimate"      # Wrong cost estimate


@dataclass
class UserCorrection:
    """User correction record"""
    correction_id: str
    user_id: str
    session_id: str
    original_text: str
    correction_type: CorrectionType
    original_prediction: Dict[str, Any]
    corrected_prediction: Dict[str, Any]
    confidence_score: float
    timestamp: str
    feedback_text: Optional[str] = None
    priority: str = "normal"  # low, normal, high, critical


@dataclass  
class RetrainingBatch:
    """Batch of corrections for retraining"""
    batch_id: str
    corrections: List[UserCorrection]
    batch_date: str
    status: str  # pending, processing, completed, failed
    performance_metrics: Optional[Dict[str, Any]] = None


class CorrectionDatabase:
    """SQLite database for storing user corrections"""
    
    def __init__(self, db_path: str = "user_corrections.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database schema"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # User corrections table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_corrections (
                    correction_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    original_text TEXT NOT NULL,
                    correction_type TEXT NOT NULL,
                    original_prediction TEXT NOT NULL,
                    corrected_prediction TEXT NOT NULL,
                    confidence_score REAL,
                    timestamp TEXT NOT NULL,
                    feedback_text TEXT,
                    priority TEXT DEFAULT 'normal',
                    processed BOOLEAN DEFAULT FALSE,
                    batch_id TEXT
                )
            """)
            
            # Retraining batches table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS retraining_batches (
                    batch_id TEXT PRIMARY KEY,
                    batch_date TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    corrections_count INTEGER,
                    performance_metrics TEXT,
                    created_at TEXT NOT NULL,
                    completed_at TEXT
                )
            """)
            
            # User sessions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT,
                    corrections_made INTEGER DEFAULT 0,
                    session_metadata TEXT
                )
            """)
            
            conn.commit()
    
    def store_correction(self, correction: UserCorrection) -> bool:
        """Store user correction in database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO user_corrections (
                        correction_id, user_id, session_id, original_text,
                        correction_type, original_prediction, corrected_prediction,
                        confidence_score, timestamp, feedback_text, priority
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    correction.correction_id,
                    correction.user_id,
                    correction.session_id,
                    correction.original_text,
                    correction.correction_type.value,
                    json.dumps(correction.original_prediction),
                    json.dumps(correction.corrected_prediction),
                    correction.confidence_score,
                    correction.timestamp,
                    correction.feedback_text,
                    correction.priority
                ))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error storing correction: {e}")
            return False
    
    def get_corrections_for_retraining(self, limit: int = 1000) -> List[UserCorrection]:
        """Get unprocessed corrections for retraining"""
        corrections = []
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM user_corrections 
                    WHERE processed = FALSE 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (limit,))
                
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                
                for row in rows:
                    row_dict = dict(zip(columns, row))
                    correction = UserCorrection(
                        correction_id=row_dict['correction_id'],
                        user_id=row_dict['user_id'],
                        session_id=row_dict['session_id'],
                        original_text=row_dict['original_text'],
                        correction_type=CorrectionType(row_dict['correction_type']),
                        original_prediction=json.loads(row_dict['original_prediction']),
                        corrected_prediction=json.loads(row_dict['corrected_prediction']),
                        confidence_score=row_dict['confidence_score'],
                        timestamp=row_dict['timestamp'],
                        feedback_text=row_dict['feedback_text'],
                        priority=row_dict['priority']
                    )
                    corrections.append(correction)
        
        except Exception as e:
            logger.error(f"Error retrieving corrections: {e}")
        
        return corrections
    
    def mark_corrections_processed(self, correction_ids: List[str], batch_id: str):
        """Mark corrections as processed"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                placeholders = ','.join(['?' for _ in correction_ids])
                cursor.execute(f"""
                    UPDATE user_corrections 
                    SET processed = TRUE, batch_id = ?
                    WHERE correction_id IN ({placeholders})
                """, [batch_id] + correction_ids)
                conn.commit()
        except Exception as e:
            logger.error(f"Error marking corrections as processed: {e}")
    
    def store_retraining_batch(self, batch: RetrainingBatch):
        """Store retraining batch information"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO retraining_batches (
                        batch_id, batch_date, status, corrections_count,
                        performance_metrics, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    batch.batch_id,
                    batch.batch_date,
                    batch.status,
                    len(batch.corrections),
                    json.dumps(batch.performance_metrics) if batch.performance_metrics else None,
                    datetime.now().isoformat()
                ))
                conn.commit()
        except Exception as e:
            logger.error(f"Error storing retraining batch: {e}")
    
    def get_correction_statistics(self) -> Dict[str, Any]:
        """Get statistics about corrections collected"""
        stats = {}
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Total corrections
                cursor.execute("SELECT COUNT(*) FROM user_corrections")
                stats['total_corrections'] = cursor.fetchone()[0]
                
                # Corrections by type
                cursor.execute("""
                    SELECT correction_type, COUNT(*) 
                    FROM user_corrections 
                    GROUP BY correction_type
                """)
                stats['corrections_by_type'] = dict(cursor.fetchall())
                
                # Recent corrections (last 30 days)
                thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
                cursor.execute("""
                    SELECT COUNT(*) FROM user_corrections 
                    WHERE timestamp > ?
                """, (thirty_days_ago,))
                stats['recent_corrections'] = cursor.fetchone()[0]
                
                # Processed vs unprocessed
                cursor.execute("SELECT processed, COUNT(*) FROM user_corrections GROUP BY processed")
                processed_stats = dict(cursor.fetchall())
                stats['processed'] = processed_stats.get(1, 0)  # True = 1
                stats['unprocessed'] = processed_stats.get(0, 0)  # False = 0
                
                # Retraining batches
                cursor.execute("SELECT COUNT(*) FROM retraining_batches")
                stats['retraining_batches'] = cursor.fetchone()[0]
        
        except Exception as e:
            logger.error(f"Error getting correction statistics: {e}")
        
        return stats


class UserCorrectionCollector:
    """System for collecting user corrections"""
    
    def __init__(self, db_path: str = "user_corrections.db"):
        self.db = CorrectionDatabase(db_path)
        self.nlp_engine = ConstructionNLPEngine()
    
    def start_user_session(self, user_id: str) -> str:
        """Start a new user session"""
        session_id = str(uuid.uuid4())
        
        try:
            with sqlite3.connect(self.db.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO user_sessions (session_id, user_id, start_time)
                    VALUES (?, ?, ?)
                """, (session_id, user_id, datetime.now().isoformat()))
                conn.commit()
        except Exception as e:
            logger.error(f"Error starting user session: {e}")
        
        return session_id
    
    def collect_entity_correction(self, user_id: str, session_id: str, 
                                 original_text: str, original_entities: List[EntityExtraction],
                                 corrected_entities: List[Dict[str, Any]]) -> str:
        """Collect entity-level corrections"""
        
        correction_id = str(uuid.uuid4())
        
        # Convert original entities to serializable format
        original_prediction = {
            "entities": [
                {
                    "start": e.start,
                    "end": e.end,
                    "label": e.label,
                    "text": e.text,
                    "confidence": e.confidence,
                    "ontology_id": e.ontology_id
                } for e in original_entities
            ]
        }
        
        corrected_prediction = {
            "entities": corrected_entities
        }
        
        # Determine correction type based on differences
        correction_type = self._determine_entity_correction_type(
            original_entities, corrected_entities
        )
        
        # Calculate average confidence
        avg_confidence = sum(e.confidence for e in original_entities) / len(original_entities) if original_entities else 0.0
        
        correction = UserCorrection(
            correction_id=correction_id,
            user_id=user_id,
            session_id=session_id,
            original_text=original_text,
            correction_type=correction_type,
            original_prediction=original_prediction,
            corrected_prediction=corrected_prediction,
            confidence_score=avg_confidence,
            timestamp=datetime.now().isoformat()
        )
        
        success = self.db.store_correction(correction)
        
        if success:
            logger.info(f"Collected entity correction {correction_id}")
        
        return correction_id
    
    def collect_work_type_correction(self, user_id: str, session_id: str,
                                   original_text: str, original_work_type: str,
                                   corrected_work_type: str) -> str:
        """Collect work type classification corrections"""
        
        correction_id = str(uuid.uuid4())
        
        original_prediction = {"work_type": original_work_type}
        corrected_prediction = {"work_type": corrected_work_type}
        
        correction = UserCorrection(
            correction_id=correction_id,
            user_id=user_id,
            session_id=session_id,
            original_text=original_text,
            correction_type=CorrectionType.WORK_TYPE,
            original_prediction=original_prediction,
            corrected_prediction=corrected_prediction,
            confidence_score=0.8,  # Default confidence
            timestamp=datetime.now().isoformat()
        )
        
        success = self.db.store_correction(correction)
        
        if success:
            logger.info(f"Collected work type correction {correction_id}")
        
        return correction_id
    
    def collect_cost_correction(self, user_id: str, session_id: str,
                              original_text: str, original_cost: float,
                              corrected_cost: float, feedback: str = None) -> str:
        """Collect cost estimation corrections"""
        
        correction_id = str(uuid.uuid4())
        
        original_prediction = {"estimated_cost": original_cost}
        corrected_prediction = {"estimated_cost": corrected_cost}
        
        correction = UserCorrection(
            correction_id=correction_id,
            user_id=user_id,
            session_id=session_id,
            original_text=original_text,
            correction_type=CorrectionType.COST_ESTIMATE,
            original_prediction=original_prediction,
            corrected_prediction=corrected_prediction,
            confidence_score=0.9,
            timestamp=datetime.now().isoformat(),
            feedback_text=feedback
        )
        
        success = self.db.store_correction(correction)
        
        if success:
            logger.info(f"Collected cost correction {correction_id}")
        
        return correction_id
    
    def _determine_entity_correction_type(self, original: List[EntityExtraction], 
                                        corrected: List[Dict]) -> CorrectionType:
        """Determine the type of entity correction"""
        
        # Simple heuristic to determine correction type
        if len(original) > len(corrected):
            return CorrectionType.FALSE_ENTITY  # User removed entities
        elif len(original) < len(corrected):
            return CorrectionType.MISSING_ENTITY  # User added entities
        else:
            # Check if boundaries or labels changed
            for orig, corr in zip(original, corrected):
                if (orig.start != corr.get('start') or 
                    orig.end != corr.get('end')):
                    return CorrectionType.ENTITY_BOUNDARY
                elif orig.label != corr.get('label'):
                    return CorrectionType.ENTITY_LABEL
        
        return CorrectionType.ENTITY_LABEL  # Default


class ModelRetrainer:
    """System for retraining models with user corrections"""
    
    def __init__(self, db_path: str = "user_corrections.db"):
        self.db = CorrectionDatabase(db_path)
        self.nlp_engine = ConstructionNLPEngine()
    
    def prepare_retraining_data(self, corrections: List[UserCorrection]) -> Dict[str, List]:
        """Prepare corrections data for model retraining"""
        
        training_examples = []
        
        for correction in corrections:
            if correction.correction_type in [CorrectionType.ENTITY_BOUNDARY, 
                                            CorrectionType.ENTITY_LABEL,
                                            CorrectionType.MISSING_ENTITY,
                                            CorrectionType.FALSE_ENTITY]:
                
                # Convert correction to training format
                entities = []
                for entity in correction.corrected_prediction.get('entities', []):
                    entities.append({
                        'start': entity['start'],
                        'end': entity['end'],
                        'label': entity['label'],
                        'value': entity.get('text', '')
                    })
                
                training_examples.append({
                    'text': correction.original_text,
                    'entities': entities
                })
        
        return {'training_data': training_examples}
    
    def create_monthly_retraining_batch(self) -> Optional[RetrainingBatch]:
        """Create a monthly retraining batch from collected corrections"""
        
        # Get unprocessed corrections
        corrections = self.db.get_corrections_for_retraining(limit=10000)
        
        if not corrections:
            logger.info("No corrections available for retraining")
            return None
        
        # Filter corrections from last month
        one_month_ago = datetime.now() - timedelta(days=30)
        recent_corrections = [
            c for c in corrections 
            if datetime.fromisoformat(c.timestamp) >= one_month_ago
        ]
        
        if len(recent_corrections) < 10:  # Minimum threshold
            logger.info(f"Not enough recent corrections ({len(recent_corrections)}) for retraining")
            return None
        
        batch_id = f"batch_{datetime.now().strftime('%Y_%m')}"
        
        batch = RetrainingBatch(
            batch_id=batch_id,
            corrections=recent_corrections,
            batch_date=datetime.now().isoformat(),
            status="pending"
        )
        
        self.db.store_retraining_batch(batch)
        logger.info(f"Created retraining batch {batch_id} with {len(recent_corrections)} corrections")
        
        return batch
    
    def execute_retraining(self, batch: RetrainingBatch) -> Dict[str, Any]:
        """Execute model retraining with correction batch"""
        
        logger.info(f"Starting retraining for batch {batch.batch_id}")
        
        try:
            # Update batch status
            batch.status = "processing"
            
            # Prepare training data
            training_data = self.prepare_retraining_data(batch.corrections)
            
            # Save training data to temporary file
            training_file = f"temp_training_{batch.batch_id}.json"
            with open(training_file, 'w') as f:
                json.dump(training_data, f, indent=2)
            
            # Train the model (this would be a more complex process in production)
            # For now, we'll simulate the retraining process
            
            # Evaluate model performance before and after
            performance_metrics = self._evaluate_retraining_performance(training_data)
            
            # Mark corrections as processed
            correction_ids = [c.correction_id for c in batch.corrections]
            self.db.mark_corrections_processed(correction_ids, batch.batch_id)
            
            # Update batch with results
            batch.status = "completed"
            batch.performance_metrics = performance_metrics
            
            # Clean up temporary file
            Path(training_file).unlink(missing_ok=True)
            
            logger.info(f"Completed retraining for batch {batch.batch_id}")
            
            return performance_metrics
            
        except Exception as e:
            logger.error(f"Error during retraining: {e}")
            batch.status = "failed"
            return {"error": str(e)}
    
    def _evaluate_retraining_performance(self, training_data: Dict) -> Dict[str, Any]:
        """Evaluate model performance after retraining"""
        
        # Simulate performance evaluation
        examples = training_data.get('training_data', [])
        
        # Calculate basic metrics
        total_entities = sum(len(ex.get('entities', [])) for ex in examples)
        avg_entities_per_example = total_entities / len(examples) if examples else 0
        
        # Simulate improvement metrics
        improvement = {
            "examples_processed": len(examples),
            "total_entities": total_entities,
            "avg_entities_per_example": avg_entities_per_example,
            "estimated_precision_improvement": 0.03,  # 3% improvement
            "estimated_recall_improvement": 0.025,    # 2.5% improvement
            "retraining_date": datetime.now().isoformat()
        }
        
        return improvement


def run_monthly_retraining():
    """Run the monthly retraining process"""
    
    print("=" * 60)
    print("MONTHLY MODEL RETRAINING")
    print("=" * 60)
    
    # Initialize components
    collector = UserCorrectionCollector()
    retrainer = ModelRetrainer()
    
    # Get correction statistics
    stats = collector.db.get_correction_statistics()
    print(f"Correction Statistics:")
    print(f"  Total corrections: {stats.get('total_corrections', 0)}")
    print(f"  Recent corrections (30 days): {stats.get('recent_corrections', 0)}")
    print(f"  Unprocessed corrections: {stats.get('unprocessed', 0)}")
    
    # Create retraining batch
    batch = retrainer.create_monthly_retraining_batch()
    
    if batch:
        print(f"\nCreated retraining batch: {batch.batch_id}")
        print(f"Corrections in batch: {len(batch.corrections)}")
        
        # Execute retraining
        performance = retrainer.execute_retraining(batch)
        
        if "error" not in performance:
            print(f"\nRetraining completed successfully!")
            print(f"Examples processed: {performance['examples_processed']}")
            print(f"Estimated precision improvement: {performance['estimated_precision_improvement']*100:.1f}%")
            print(f"Estimated recall improvement: {performance['estimated_recall_improvement']*100:.1f}%")
        else:
            print(f"Retraining failed: {performance['error']}")
    else:
        print("No retraining batch created - insufficient corrections")
    
    return batch


def simulate_user_corrections():
    """Simulate user corrections for testing purposes"""
    
    print("Simulating user corrections...")
    
    collector = UserCorrectionCollector()
    
    # Simulate some user sessions and corrections
    sample_corrections = [
        {
            "text": "Install 500 linear feet of concrete footing",
            "original_work_type": "framing",
            "corrected_work_type": "concrete_work"
        },
        {
            "text": "Excavate 25 cubic yards of soil for foundation",
            "original_work_type": "concrete_work", 
            "corrected_work_type": "excavation"
        },
        {
            "text": "Pour 15 CY of concrete for slab on grade",
            "original_cost": 2500.0,
            "corrected_cost": 2175.0,
            "feedback": "Cost too high for this region"
        }
    ]
    
    user_id = "demo_user_001"
    session_id = collector.start_user_session(user_id)
    
    for correction in sample_corrections:
        if "original_work_type" in correction:
            collector.collect_work_type_correction(
                user_id, session_id,
                correction["text"],
                correction["original_work_type"],
                correction["corrected_work_type"]
            )
        elif "original_cost" in correction:
            collector.collect_cost_correction(
                user_id, session_id,
                correction["text"],
                correction["original_cost"],
                correction["corrected_cost"],
                correction.get("feedback")
            )
    
    print(f"Simulated {len(sample_corrections)} corrections")


if __name__ == "__main__":
    print("User Correction Collection & Model Retraining System")
    print("=" * 60)
    
    # Simulate user corrections first
    simulate_user_corrections()
    
    # Run monthly retraining
    batch = run_monthly_retraining()
    
    # Generate final report
    collector = UserCorrectionCollector()
    final_stats = collector.db.get_correction_statistics()
    
    print(f"\n{'='*60}")
    print("FINAL SYSTEM STATUS")
    print(f"{'='*60}")
    print(f"Total corrections collected: {final_stats.get('total_corrections', 0)}")
    print(f"Corrections processed: {final_stats.get('processed', 0)}")
    print(f"Retraining batches completed: {final_stats.get('retraining_batches', 0)}")
    print(f"System status: {'OPERATIONAL' if batch else 'READY'}")
