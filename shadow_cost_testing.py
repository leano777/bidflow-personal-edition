"""
Shadow Cost Variance Testing System

Performs shadow runs on historical estimates to compare cost variance
Target: ±5% cost variance between historical and current NLP-based estimates
"""

import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from pathlib import Path
import random

from construction_nlp_engine import ConstructionNLPEngine
from construction_ontology import ConstructionOntology

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class HistoricalEstimate:
    """Historical construction estimate record"""
    estimate_id: str
    project_name: str
    estimate_date: str
    scope_text: str
    original_cost: float
    unit_cost: float
    quantity: float
    unit: str
    work_type: str
    location: str
    crew_type: str
    equipment_used: List[str]
    materials_used: List[str]
    actual_cost: Optional[float] = None  # If project was completed


@dataclass
class ShadowTestResult:
    """Result of shadow testing comparison"""
    estimate_id: str
    original_cost: float
    shadow_cost: float
    variance_amount: float
    variance_percentage: float
    within_target: bool
    confidence_score: float
    analysis_metadata: Dict[str, Any]
    timestamp: str


class CostEstimationEngine:
    """Cost estimation engine using historical data and NLP analysis"""
    
    def __init__(self):
        self.unit_cost_database = self._initialize_unit_costs()
        self.regional_multipliers = self._initialize_regional_multipliers()
        self.equipment_rates = self._initialize_equipment_rates()
        self.crew_rates = self._initialize_crew_rates()
    
    def _initialize_unit_costs(self) -> Dict[str, Dict[str, float]]:
        """Initialize unit cost database by work type and material"""
        return {
            "concrete_work": {
                "concrete_per_cy": 145.00,
                "concrete_footing_per_lf": 12.50,
                "concrete_slab_per_sf": 8.75,
                "rebar_per_lb": 1.25,
                "formwork_per_sf": 6.50
            },
            "excavation": {
                "excavation_per_cy": 8.50,
                "backfill_per_cy": 6.25,
                "grading_per_sy": 3.75,
                "trenching_per_lf": 4.50
            },
            "framing": {
                "lumber_framing_per_bf": 2.85,
                "exterior_wall_per_sf": 12.50,
                "interior_wall_per_sf": 8.75,
                "roof_framing_per_sf": 15.25
            },
            "electrical": {
                "conduit_per_lf": 8.50,
                "wire_per_lf": 2.25,
                "outlet_installation_ea": 125.00,
                "panel_installation_ea": 850.00
            },
            "plumbing": {
                "pipe_per_lf": 12.50,
                "fixture_installation_ea": 325.00,
                "water_line_per_lf": 15.75
            },
            "masonry": {
                "brick_per_sf": 18.50,
                "cmu_per_sf": 12.25,
                "mortar_per_bag": 8.50
            },
            "drywall": {
                "drywall_per_sf": 4.25,
                "tape_finish_per_sf": 2.75,
                "texture_per_sf": 1.50
            },
            "roofing": {
                "shingles_per_square": 285.00,
                "underlayment_per_square": 45.00,
                "flashing_per_lf": 8.50
            },
            "insulation": {
                "batt_insulation_per_sf": 2.85,
                "blown_insulation_per_sf": 1.95
            },
            "flooring": {
                "tile_per_sf": 12.50,
                "hardwood_per_sf": 18.75,
                "carpet_per_sf": 6.25
            }
        }
    
    def _initialize_regional_multipliers(self) -> Dict[str, float]:
        """Regional cost multipliers"""
        return {
            "urban_high": 1.25,
            "urban_medium": 1.15,
            "suburban": 1.00,
            "rural": 0.85,
            "remote": 0.75
        }
    
    def _initialize_equipment_rates(self) -> Dict[str, float]:
        """Equipment hourly rates"""
        return {
            "excavator": 125.00,
            "bulldozer": 145.00,
            "concrete_mixer": 85.00,
            "crane": 185.00,
            "compactor": 65.00,
            "forklift": 45.00,
            "skid_steer": 75.00,
            "dump_truck": 95.00
        }
    
    def _initialize_crew_rates(self) -> Dict[str, float]:
        """Crew hourly rates"""
        return {
            "concrete_crew": 185.00,
            "framing_crew": 165.00,
            "electrical_crew": 225.00,
            "plumbing_crew": 195.00,
            "masonry_crew": 175.00,
            "drywall_crew": 145.00,
            "roofing_crew": 185.00,
            "excavation_crew": 155.00,
            "general_laborers": 125.00,
            "finish_crew": 165.00
        }
    
    def estimate_cost_from_analysis(self, analysis_result: Dict[str, Any], 
                                  location: str = "suburban") -> float:
        """Generate cost estimate from NLP analysis results"""
        
        work_type = analysis_result.get('analysis_metadata', {}).get('work_type')
        quantity = analysis_result.get('analysis_metadata', {}).get('total_quantity', 1.0)
        unit = analysis_result.get('analysis_metadata', {}).get('primary_unit', 'ea')
        
        if not work_type or work_type not in self.unit_cost_database:
            # Fallback estimation
            base_cost = 100.0 * quantity
        else:
            # Get unit costs for work type
            unit_costs = self.unit_cost_database[work_type]
            
            # Find appropriate unit cost
            unit_cost_key = self._match_unit_cost_key(work_type, unit, unit_costs)
            base_unit_cost = unit_costs.get(unit_cost_key, 50.0)
            
            base_cost = base_unit_cost * quantity
        
        # Apply regional multiplier
        regional_multiplier = self.regional_multipliers.get(location, 1.0)
        adjusted_cost = base_cost * regional_multiplier
        
        # Add equipment and crew costs if specified
        materials = analysis_result.get('ontology_alignment', {}).get('materials', [])
        equipment = analysis_result.get('ontology_alignment', {}).get('equipment', [])
        
        # Equipment costs (assume 4 hours average)
        equipment_cost = 0.0
        for equip in equipment:
            equip_canonical = equip.get('canonical', '')
            if equip_canonical in self.equipment_rates:
                equipment_cost += self.equipment_rates[equip_canonical] * 4  # 4 hours
        
        # Crew costs (assume 8 hours for project)
        crew_cost = 0.0
        if work_type and f"{work_type.replace('_work', '')}_crew" in self.crew_rates:
            crew_key = f"{work_type.replace('_work', '')}_crew"
            crew_cost = self.crew_rates[crew_key] * 8  # 8 hours
        
        total_cost = adjusted_cost + equipment_cost + crew_cost
        
        # Apply overhead and profit (25%)
        final_cost = total_cost * 1.25
        
        return round(final_cost, 2)
    
    def _match_unit_cost_key(self, work_type: str, unit: str, unit_costs: Dict[str, float]) -> str:
        """Match unit to appropriate unit cost key"""
        unit_lower = unit.lower() if unit else ''
        
        # Direct matches
        for key in unit_costs.keys():
            if unit_lower in key.lower():
                return key
        
        # Fallback matches by work type
        fallback_keys = {
            "concrete_work": "concrete_per_cy",
            "excavation": "excavation_per_cy",
            "framing": "lumber_framing_per_bf",
            "electrical": "conduit_per_lf",
            "plumbing": "pipe_per_lf",
            "masonry": "brick_per_sf",
            "drywall": "drywall_per_sf",
            "roofing": "shingles_per_square",
            "insulation": "batt_insulation_per_sf",
            "flooring": "tile_per_sf"
        }
        
        return fallback_keys.get(work_type, list(unit_costs.keys())[0])


class HistoricalDataGenerator:
    """Generate realistic historical construction estimate data for testing"""
    
    def __init__(self, seed: int = 42):
        random.seed(seed)
        np.random.seed(seed)
        self.cost_engine = CostEstimationEngine()
    
    def generate_historical_dataset(self, num_estimates: int = 100) -> List[HistoricalEstimate]:
        """Generate synthetic historical estimates based on realistic patterns"""
        
        # Sample scope texts from training data
        scope_templates = [
            "Install {quantity} {unit} of concrete footing with #4 rebar at 12 inch centers",
            "Excavate {quantity} {unit} of soil for foundation using track hoe",
            "Frame {quantity} {unit} of exterior walls using 2x6 lumber at 16 OC spacing",
            "Pour {quantity} {unit} of concrete for slab on grade with 4000 PSI strength",
            "Install electrical conduit {quantity} {unit} of 3/4 inch EMT for branch circuits",
            "Lay {quantity} concrete masonry units for retaining wall with mortar joints",
            "Hang and finish {quantity} {unit} of 5/8 inch drywall on interior walls",
            "Install R-19 batt insulation in {quantity} {unit} of wall cavities",
            "Run {quantity} {unit} of 4 inch PVC pipe for storm drainage system",
            "Apply {quantity} squares of asphalt shingles on sloped roof with 30 year warranty"
        ]
        
        work_types = ["concrete_work", "excavation", "framing", "electrical", "plumbing", 
                     "masonry", "drywall", "insulation", "roofing"]
        
        units = ["linear feet", "cubic yards", "square feet", "each", "squares"]
        locations = ["urban_high", "urban_medium", "suburban", "rural"]
        
        estimates = []
        
        for i in range(num_estimates):
            # Generate random parameters
            work_type = random.choice(work_types)
            unit = random.choice(units)
            quantity = round(random.uniform(10, 2000), 0)
            location = random.choice(locations)
            
            # Create scope text
            scope_template = random.choice(scope_templates)
            scope_text = scope_template.format(quantity=int(quantity), unit=unit)
            
            # Generate base cost with some historical variation
            base_cost = self._calculate_historical_base_cost(work_type, quantity, unit, location)
            
            # Add historical variance (±15% for realism)
            variance_factor = random.uniform(0.85, 1.15)
            historical_cost = round(base_cost * variance_factor, 2)
            
            # Calculate unit cost
            unit_cost = round(historical_cost / quantity, 2) if quantity > 0 else 0.0
            
            # Generate estimate
            estimate_date = self._generate_random_date()
            
            estimate = HistoricalEstimate(
                estimate_id=f"EST-{i+1:04d}",
                project_name=f"Project {i+1}",
                estimate_date=estimate_date,
                scope_text=scope_text,
                original_cost=historical_cost,
                unit_cost=unit_cost,
                quantity=quantity,
                unit=unit,
                work_type=work_type,
                location=location,
                crew_type=f"{work_type.replace('_work', '')}_crew",
                equipment_used=[],
                materials_used=[]
            )
            
            estimates.append(estimate)
        
        return estimates
    
    def _calculate_historical_base_cost(self, work_type: str, quantity: float, 
                                      unit: str, location: str) -> float:
        """Calculate base cost for historical estimate"""
        unit_costs = self.cost_engine.unit_cost_database.get(work_type, {})
        
        if not unit_costs:
            return 100.0 * quantity
        
        # Get representative unit cost
        unit_cost_key = list(unit_costs.keys())[0]
        base_unit_cost = list(unit_costs.values())[0]
        
        base_cost = base_unit_cost * quantity
        
        # Apply regional multiplier
        regional_multiplier = self.cost_engine.regional_multipliers.get(location, 1.0)
        
        return base_cost * regional_multiplier * 1.25  # 25% overhead/profit
    
    def _generate_random_date(self) -> str:
        """Generate random date within last 2 years"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=730)  # 2 years
        
        time_between = end_date - start_date
        days_between = time_between.days
        random_days = random.randrange(days_between)
        
        random_date = start_date + timedelta(days=random_days)
        return random_date.strftime("%Y-%m-%d")


class ShadowTesting:
    """Shadow testing system for cost variance analysis"""
    
    def __init__(self):
        self.nlp_engine = ConstructionNLPEngine()
        self.cost_engine = CostEstimationEngine()
        self.variance_target = 0.05  # ±5% target variance
    
    def run_shadow_tests(self, historical_estimates: List[HistoricalEstimate]) -> List[ShadowTestResult]:
        """Run shadow tests on historical estimates"""
        
        shadow_results = []
        
        logger.info(f"Running shadow tests on {len(historical_estimates)} historical estimates")
        
        for estimate in historical_estimates:
            try:
                # Analyze scope text with current NLP engine
                analysis = self.nlp_engine.analyze_construction_scope(estimate.scope_text)
                structured_output = self.nlp_engine.export_structured_output(analysis)
                
                # Generate cost estimate using current system
                shadow_cost = self.cost_engine.estimate_cost_from_analysis(
                    structured_output, estimate.location
                )
                
                # Calculate variance
                variance_amount = shadow_cost - estimate.original_cost
                variance_percentage = (variance_amount / estimate.original_cost) if estimate.original_cost > 0 else 0.0
                
                # Check if within target
                within_target = abs(variance_percentage) <= self.variance_target
                
                # Create result
                result = ShadowTestResult(
                    estimate_id=estimate.estimate_id,
                    original_cost=estimate.original_cost,
                    shadow_cost=shadow_cost,
                    variance_amount=variance_amount,
                    variance_percentage=variance_percentage,
                    within_target=within_target,
                    confidence_score=analysis.confidence_score,
                    analysis_metadata=structured_output.get('analysis_metadata', {}),
                    timestamp=datetime.now().isoformat()
                )
                
                shadow_results.append(result)
                
            except Exception as e:
                logger.error(f"Error processing estimate {estimate.estimate_id}: {e}")
                continue
        
        return shadow_results
    
    def analyze_shadow_results(self, shadow_results: List[ShadowTestResult]) -> Dict[str, Any]:
        """Analyze shadow test results and generate comprehensive report"""
        
        if not shadow_results:
            return {"error": "No shadow test results to analyze"}
        
        # Convert to DataFrame for analysis
        data = []
        for result in shadow_results:
            data.append({
                'estimate_id': result.estimate_id,
                'original_cost': result.original_cost,
                'shadow_cost': result.shadow_cost,
                'variance_amount': result.variance_amount,
                'variance_percentage': result.variance_percentage,
                'within_target': result.within_target,
                'confidence_score': result.confidence_score,
                'abs_variance_pct': abs(result.variance_percentage)
            })
        
        df = pd.DataFrame(data)
        
        # Calculate summary statistics
        total_tests = len(shadow_results)
        within_target_count = df['within_target'].sum()
        success_rate = within_target_count / total_tests if total_tests > 0 else 0.0
        
        variance_stats = {
            'mean_variance_pct': df['variance_percentage'].mean(),
            'std_variance_pct': df['variance_percentage'].std(),
            'median_variance_pct': df['variance_percentage'].median(),
            'min_variance_pct': df['variance_percentage'].min(),
            'max_variance_pct': df['variance_percentage'].max(),
            'mean_abs_variance_pct': df['abs_variance_pct'].mean(),
            'percentile_95_abs_variance': np.percentile(df['abs_variance_pct'], 95)
        }
        
        # Cost difference statistics
        cost_stats = {
            'mean_cost_difference': df['variance_amount'].mean(),
            'total_cost_difference': df['variance_amount'].sum(),
            'mean_original_cost': df['original_cost'].mean(),
            'mean_shadow_cost': df['shadow_cost'].mean()
        }
        
        # Confidence score analysis
        confidence_stats = {
            'mean_confidence': df['confidence_score'].mean(),
            'min_confidence': df['confidence_score'].min(),
            'max_confidence': df['confidence_score'].max()
        }
        
        # Variance distribution
        variance_distribution = {
            'within_1_percent': (df['abs_variance_pct'] <= 0.01).sum(),
            'within_2_percent': (df['abs_variance_pct'] <= 0.02).sum(),
            'within_5_percent': (df['abs_variance_pct'] <= 0.05).sum(),
            'within_10_percent': (df['abs_variance_pct'] <= 0.10).sum(),
            'over_10_percent': (df['abs_variance_pct'] > 0.10).sum()
        }
        
        # Detailed results for outliers
        outliers = df[df['abs_variance_pct'] > self.variance_target].to_dict('records')
        
        return {
            'summary': {
                'total_tests': total_tests,
                'within_target': within_target_count,
                'success_rate': success_rate,
                'target_variance': self.variance_target,
                'passes_requirement': success_rate >= 0.80  # 80% within ±5%
            },
            'variance_statistics': variance_stats,
            'cost_statistics': cost_stats,
            'confidence_statistics': confidence_stats,
            'variance_distribution': variance_distribution,
            'outliers': outliers[:10],  # Top 10 outliers
            'test_timestamp': datetime.now().isoformat()
        }
    
    def generate_shadow_report(self, shadow_results: List[ShadowTestResult], 
                             output_file: str = "shadow_test_report.json"):
        """Generate comprehensive shadow test report"""
        
        analysis = self.analyze_shadow_results(shadow_results)
        
        # Add individual results
        results_data = []
        for result in shadow_results:
            results_data.append({
                'estimate_id': result.estimate_id,
                'original_cost': result.original_cost,
                'shadow_cost': result.shadow_cost,
                'variance_amount': result.variance_amount,
                'variance_percentage': result.variance_percentage,
                'within_target': result.within_target,
                'confidence_score': result.confidence_score,
                'timestamp': result.timestamp
            })
        
        report = {
            'shadow_test_analysis': analysis,
            'individual_results': results_data,
            'report_metadata': {
                'generated_at': datetime.now().isoformat(),
                'total_estimates_tested': len(shadow_results),
                'variance_target': f"±{self.variance_target*100}%",
                'nlp_engine_version': "1.0.0"
            }
        }
        
        # Save report
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Shadow test report saved to {output_file}")
        return report


def run_comprehensive_shadow_testing():
    """Run comprehensive shadow testing pipeline"""
    
    print("=" * 60)
    print("SHADOW COST VARIANCE TESTING")
    print("=" * 60)
    
    # Generate historical dataset
    print("Generating historical dataset...")
    data_generator = HistoricalDataGenerator()
    historical_estimates = data_generator.generate_historical_dataset(num_estimates=50)
    print(f"Generated {len(historical_estimates)} historical estimates")
    
    # Initialize shadow testing
    shadow_tester = ShadowTesting()
    
    # Run shadow tests
    print("Running shadow tests...")
    shadow_results = shadow_tester.run_shadow_tests(historical_estimates)
    print(f"Completed {len(shadow_results)} shadow tests")
    
    # Analyze results
    print("Analyzing results...")
    report = shadow_tester.generate_shadow_report(shadow_results)
    
    # Print summary
    summary = report['shadow_test_analysis']['summary']
    variance_stats = report['shadow_test_analysis']['variance_statistics']
    
    print(f"\nSUMMARY RESULTS:")
    print(f"Total tests run: {summary['total_tests']}")
    print(f"Within ±5% target: {summary['within_target']}/{summary['total_tests']} ({summary['success_rate']*100:.1f}%)")
    print(f"Mean absolute variance: {variance_stats['mean_abs_variance_pct']*100:.2f}%")
    print(f"95th percentile variance: {variance_stats['percentile_95_abs_variance']*100:.2f}%")
    print(f"Requirement status: {'PASS' if summary['passes_requirement'] else 'FAIL'}")
    
    # Variance distribution
    dist = report['shadow_test_analysis']['variance_distribution']
    print(f"\nVARIANCE DISTRIBUTION:")
    print(f"Within ±1%: {dist['within_1_percent']} estimates")
    print(f"Within ±2%: {dist['within_2_percent']} estimates")
    print(f"Within ±5%: {dist['within_5_percent']} estimates")
    print(f"Over ±10%: {dist['over_10_percent']} estimates")
    
    return report


if __name__ == "__main__":
    # Run comprehensive shadow testing
    report = run_comprehensive_shadow_testing()
    
    # Exit with appropriate code
    passes = report['shadow_test_analysis']['summary']['passes_requirement']
    exit(0 if passes else 1)
