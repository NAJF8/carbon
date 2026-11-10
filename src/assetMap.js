import robotAvatar from './assets/carbon-robot.webp';
import goldStandardWhey from './assets/products/gold-standard-whey.svg';
import onCreatine from './assets/products/on-creatine.svg';
import kevinGoldCreatine from './assets/products/kevin-gold-creatine.svg';
import nitrotech from './assets/products/nitrotech.svg';
import criticalWhey from './assets/products/critical-whey.svg';
import iso100 from './assets/products/iso100.svg';
import syntha6 from './assets/products/syntha6.svg';
import r1Protein from './assets/products/r1-protein.svg';
import c4Original from './assets/products/c4-original.svg';
import mutantMass from './assets/products/mutant-mass.svg';
import animalPak from './assets/products/animal-pak.svg';
import myproteinCreatine from './assets/products/myprotein-creatine.svg';

export { robotAvatar };

const productImages = {
  'gold-standard-whey': goldStandardWhey,
  'on-creatine': onCreatine,
  'kevin-gold-creatine': kevinGoldCreatine,
  'nitrotech': nitrotech,
  'critical-whey': criticalWhey,
  'iso100': iso100,
  'syntha6': syntha6,
  'r1-protein': r1Protein,
  'c4-original': c4Original,
  'mutant-mass': mutantMass,
  'animal-pak': animalPak,
  'myprotein-creatine': myproteinCreatine,
};

export function getProductImage(slug, fallback = null) {
  return productImages[slug] || fallback;
}
