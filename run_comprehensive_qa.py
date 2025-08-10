"""
Comprehensive QA and Continuous Improvement Test Runner

Orchestrates all testing components:
1. Unit and integration tests (>90% coverage)
2. Performance benchmarking (≥92% precision/recall)
3. Shadow cost variance testing (±5% target)
4. User correction system validation

Master script for complete testing pipeline
"""

import sys
import os
import subprocess
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Tuple
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('qa_test_results.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ComprehensiveQARunner:
    """Master test runner for all QA components"""
    
    def __init__(self):
        self.results = {
            'start_time': datetime.now().isoformat(),
            'unit_tests': None,
            'performance_benchmark': None,
            'shadow_testing': None,
            'user_correction_system': None,
            'overall_status': 'PENDING',
            'completion_time': None
        }
        
        # Quality targets
        self.targets = {
            'unit_test_coverage': 0.90,      # >90% coverage
            'precision_target': 0.92,        # ≥92% precision
            'recall_target': 0.92,           # ≥92% recall
            'cost_variance_target': 0.05,    # ±5% cost variance
            'shadow_test_success_rate': 0.80  # 80% within variance target
        }
    
    def run_unit_and_integration_tests(self) -> Dict[str, Any]:
        """Run comprehensive unit and integration tests"""
        
        logger.info("=" * 60)
        logger.info("RUNNING UNIT AND INTEGRATION TESTS")
        logger.info("=" * 60)
        
        try:
            # Import and run test suite
            from test_construction_nlp import run_test_suite, run_performance_benchmark
            
            # Run unit tests
            test_result = run_test_suite()
            
            # Calculate coverage metrics
            total_tests = test_result.testsRun
            failures = len(test_result.failures)
            errors = len(test_result.errors)
            passed = total_tests - failures - errors
            coverage_rate = passed / total_tests if total_tests > 0 else 0.0
            
            # Run performance benchmark
            benchmark_result = run_performance_benchmark()
            
            unit_test_results = {
                'total_tests': total_tests,
                'passed': passed,
                'failures': failures,
                'errors': errors,
                'coverage_rate': coverage_rate,
                'meets_coverage_target': coverage_rate >= self.targets['unit_test_coverage'],
                'benchmark_results': benchmark_result,
                'status': 'PASS' if (coverage_rate >= self.targets['unit_test_coverage'] and 
                                   benchmark_result and 
                                   benchmark_result['summary']['avg_precision'] >= self.targets['precision_target'] and
                                   benchmark_result['summary']['avg_recall'] >= self.targets['recall_target']) else 'FAIL'
            }
            
            self.results['unit_tests'] = unit_test_results
            logger.info(f"Unit tests completed: {unit_test_results['status']}")
            
            return unit_test_results
            
        except Exception as e:
            logger.error(f"Error running unit tests: {e}")
            error_result = {
                'error': str(e),
                'status': 'ERROR'
            }
            self.results['unit_tests'] = error_result
            return error_result
    
    def run_shadow_cost_testing(self) -> Dict[str, Any]:
        """Run shadow cost variance testing"""
        
        logger.info("=" * 60)
        logger.info("RUNNING SHADOW COST TESTING")
        logger.info("=" * 60)
        
        try:
            from shadow_cost_testing import run_comprehensive_shadow_testing
            
            # Run shadow testing
            shadow_report = run_comprehensive_shadow_testing()
            
            # Extract key metrics
            summary = shadow_report['shadow_test_analysis']['summary']
            variance_stats = shadow_report['shadow_test_analysis']['variance_statistics']
            
            shadow_results = {
                'total_tests': summary['total_tests'],
                'within_target': summary['within_target'],
                'success_rate': summary['success_rate'],
                'mean_abs_variance': variance_stats['mean_abs_variance_pct'],
                'percentile_95_variance': variance_stats['percentile_95_abs_variance'],
                'meets_variance_target': summary['passes_requirement'],
                'full_report': shadow_report,
                'status': 'PASS' if summary['passes_requirement'] else 'FAIL'
            }
            
            self.results['shadow_testing'] = shadow_results
            logger.info(f"Shadow testing completed: {shadow_results['status']}")
            
            return shadow_results
            
        except Exception as e:
            logger.error(f"Error running shadow tests: {e}")
            error_result = {
                'error': str(e),
                'status': 'ERROR'
            }
            self.results['shadow_testing'] = error_result
            return error_result
    
    def validate_user_correction_system(self) -> Dict[str, Any]:
        """Validate user correction collection and retraining system"""
        
        logger.info("=" * 60)
        logger.info("VALIDATING USER CORRECTION SYSTEM")
        logger.info("=" * 60)
        
        try:
            from user_correction_system import (
                simulate_user_corrections, 
                run_monthly_retraining,
                UserCorrectionCollector
            )
            
            # Simulate user corrections
            simulate_user_corrections()
            
            # Run monthly retraining
            retraining_batch = run_monthly_retraining()
            
            # Get system statistics
            collector = UserCorrectionCollector()
            stats = collector.db.get_correction_statistics()
            
            correction_results = {
                'corrections_collected': stats.get('total_corrections', 0),
                'corrections_processed': stats.get('processed', 0),
                'retraining_batches': stats.get('retraining_batches', 0),
                'system_operational': retraining_batch is not None,
                'batch_created': retraining_batch.batch_id if retraining_batch else None,
                'corrections_by_type': stats.get('corrections_by_type', {}),
                'status': 'PASS' if (stats.get('total_corrections', 0) > 0 and 
                                   stats.get('retraining_batches', 0) > 0) else 'FAIL'
            }
            
            self.results['user_correction_system'] = correction_results
            logger.info(f"User correction system validation: {correction_results['status']}")
            
            return correction_results
            
        except Exception as e:
            logger.error(f"Error validating correction system: {e}")
            error_result = {
                'error': str(e),
                'status': 'ERROR'
            }
            self.results['user_correction_system'] = error_result
            return error_result
    
    def install_requirements(self) -> bool:
        """Install required packages"""
        
        logger.info("Installing required packages...")
        
        try:
            # Install requirements
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("Requirements installed successfully")
                return True
            else:
                logger.error(f"Failed to install requirements: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error installing requirements: {e}")
            return False
    
    def generate_comprehensive_report(self) -> Dict[str, Any]:
        """Generate comprehensive QA report"""
        
        # Calculate overall status
        component_statuses = []
        
        if self.results['unit_tests']:
            component_statuses.append(self.results['unit_tests']['status'])
        
        if self.results['shadow_testing']:
            component_statuses.append(self.results['shadow_testing']['status'])
            
        if self.results['user_correction_system']:
            component_statuses.append(self.results['user_correction_system']['status'])
        
        # Overall pass if all components pass
        overall_pass = all(status == 'PASS' for status in component_statuses if status != 'ERROR')
        overall_status = 'PASS' if overall_pass and len(component_statuses) >= 3 else 'FAIL'
        
        if any(status == 'ERROR' for status in component_statuses):
            overall_status = 'ERROR'
        
        self.results['overall_status'] = overall_status
        self.results['completion_time'] = datetime.now().isoformat()
        
        # Create summary report
        summary_report = {
            'test_execution_summary': {
                'start_time': self.results['start_time'],
                'completion_time': self.results['completion_time'],
                'overall_status': overall_status,
                'components_tested': len([r for r in [
                    self.results['unit_tests'],
                    self.results['shadow_testing'], 
                    self.results['user_correction_system']
                ] if r is not None])
            },
            'quality_targets': self.targets,
            'component_results': {
                'unit_and_integration_tests': {
                    'status': self.results['unit_tests']['status'] if self.results['unit_tests'] else 'NOT_RUN',
                    'coverage_achieved': self.results['unit_tests']['coverage_rate'] if self.results['unit_tests'] else 0.0,
                    'target_coverage': self.targets['unit_test_coverage'],
                    'meets_target': (self.results['unit_tests']['meets_coverage_target'] 
                                   if self.results['unit_tests'] else False)
                },
                'performance_benchmark': {
                    'precision_achieved': (self.results['unit_tests']['benchmark_results']['summary']['avg_precision']
                                         if self.results['unit_tests'] and 
                                            self.results['unit_tests']['benchmark_results'] else 0.0),
                    'recall_achieved': (self.results['unit_tests']['benchmark_results']['summary']['avg_recall'] 
                                      if self.results['unit_tests'] and 
                                         self.results['unit_tests']['benchmark_results'] else 0.0),
                    'precision_target': self.targets['precision_target'],
                    'recall_target': self.targets['recall_target']
                },
                'shadow_cost_testing': {
                    'status': self.results['shadow_testing']['status'] if self.results['shadow_testing'] else 'NOT_RUN',
                    'success_rate': (self.results['shadow_testing']['success_rate'] 
                                   if self.results['shadow_testing'] else 0.0),
                    'mean_variance': (self.results['shadow_testing']['mean_abs_variance']
                                    if self.results['shadow_testing'] else 0.0),
                    'variance_target': self.targets['cost_variance_target']
                },
                'user_correction_system': {
                    'status': (self.results['user_correction_system']['status'] 
                             if self.results['user_correction_system'] else 'NOT_RUN'),
                    'corrections_collected': (self.results['user_correction_system']['corrections_collected']
                                            if self.results['user_correction_system'] else 0),
                    'system_operational': (self.results['user_correction_system']['system_operational']
                                         if self.results['user_correction_system'] else False)
                }
            },
            'detailed_results': self.results
        }
        
        return summary_report
    
    def save_results(self, report: Dict[str, Any], filename: str = "comprehensive_qa_report.json"):
        """Save comprehensive test results"""
        
        try:
            with open(filename, 'w') as f:
                json.dump(report, f, indent=2, default=str)
            logger.info(f"Comprehensive QA report saved to {filename}")
        except Exception as e:
            logger.error(f"Error saving report: {e}")
    
    def print_summary(self, report: Dict[str, Any]):
        """Print executive summary of test results"""
        
        print("\n" + "=" * 80)
        print("COMPREHENSIVE QA EXECUTION SUMMARY")
        print("=" * 80)
        
        summary = report['test_execution_summary']
        print(f"Overall Status: {summary['overall_status']}")
        print(f"Components Tested: {summary['components_tested']}")
        print(f"Execution Time: {summary['start_time']} to {summary['completion_time']}")
        
        print(f"\nCOMPONENT RESULTS:")
        print("-" * 40)
        
        components = report['component_results']
        
        # Unit Tests
        unit_result = components['unit_and_integration_tests']
        print(f"Unit & Integration Tests: {unit_result['status']}")
        print(f"  Coverage: {unit_result['coverage_achieved']*100:.1f}% (Target: {unit_result['target_coverage']*100:.0f}%)")
        
        # Performance Benchmark
        perf_result = components['performance_benchmark']
        print(f"Performance Benchmark:")
        print(f"  Precision: {perf_result['precision_achieved']*100:.1f}% (Target: {perf_result['precision_target']*100:.0f}%)")
        print(f"  Recall: {perf_result['recall_achieved']*100:.1f}% (Target: {perf_result['recall_target']*100:.0f}%)")
        
        # Shadow Testing
        shadow_result = components['shadow_cost_testing']
        print(f"Shadow Cost Testing: {shadow_result['status']}")
        print(f"  Success Rate: {shadow_result['success_rate']*100:.1f}%")
        print(f"  Mean Variance: {shadow_result['mean_variance']*100:.2f}% (Target: ±{shadow_result['variance_target']*100:.0f}%)")
        
        # User Correction System
        correction_result = components['user_correction_system']
        print(f"User Correction System: {correction_result['status']}")
        print(f"  Corrections Collected: {correction_result['corrections_collected']}")
        print(f"  System Operational: {correction_result['system_operational']}")
        
        # Final verdict
        print(f"\n{'='*80}")
        if summary['overall_status'] == 'PASS':
            print("🎉 ALL QA REQUIREMENTS MET - SYSTEM READY FOR PRODUCTION")
        elif summary['overall_status'] == 'FAIL':
            print("❌ QUALITY TARGETS NOT MET - REMEDIATION REQUIRED")
        else:
            print("⚠️  TESTING ERRORS ENCOUNTERED - REVIEW REQUIRED")
        print(f"{'='*80}")
    
    def run_comprehensive_qa(self) -> Dict[str, Any]:
        """Run complete QA pipeline"""
        
        logger.info("Starting Comprehensive QA Pipeline")
        logger.info("=" * 80)
        
        # Install requirements (if needed)
        if not self.install_requirements():
            logger.warning("Failed to install requirements - continuing anyway")
        
        # Run all test components
        logger.info("Phase 1: Unit and Integration Tests")
        self.run_unit_and_integration_tests()
        
        logger.info("Phase 2: Shadow Cost Variance Testing")
        self.run_shadow_cost_testing()
        
        logger.info("Phase 3: User Correction System Validation")
        self.validate_user_correction_system()
        
        # Generate comprehensive report
        logger.info("Generating comprehensive report...")
        report = self.generate_comprehensive_report()
        
        # Save results
        self.save_results(report)
        
        # Print summary
        self.print_summary(report)
        
        return report


def main():
    """Main execution function"""
    
    print("Construction NLP Engine - Comprehensive QA Pipeline")
    print("=" * 80)
    print("Testing Framework for:")
    print("• Unit and integration tests (>90% coverage)")
    print("• Performance benchmarking (≥92% precision/recall)")
    print("• Shadow cost variance testing (±5% target)")
    print("• User correction system validation")
    print("=" * 80)
    
    # Initialize and run comprehensive QA
    qa_runner = ComprehensiveQARunner()
    report = qa_runner.run_comprehensive_qa()
    
    # Determine exit code
    overall_status = report['test_execution_summary']['overall_status']
    
    if overall_status == 'PASS':
        exit_code = 0
    elif overall_status == 'FAIL':
        exit_code = 1
    else:  # ERROR
        exit_code = 2
    
    logger.info(f"QA Pipeline completed with exit code: {exit_code}")
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
