/**
 * Calculator Bootstrap Index
 * 
 * Importing this file triggers the side-effect registration of all calculators
 * into the singleton CalculatorRegistry via their respective auto-register calls
 * at the bottom of each file.
 *
 * Import order does not matter — each calculator self-registers on module load.
 */

import './egfr.calculator';
import './child-pugh.calculator';
import './meld-na.calculator';
import './bmi.calculator';
import './edd.calculator';
import './sofa.calculator';
import './tsat.calculator';
import './vasopressor.calculator';
