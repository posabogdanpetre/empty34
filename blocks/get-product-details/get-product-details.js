// synthetic fixture — no sample data available from Action Planner
const SAMPLE_DATA = {
  name: 'Nano Puff Jacket',
  description: 'Warm, windproof, and water-resistant, the Nano Puff Jacket uses incredibly lightweight and highly compressible 60-g PrimaLoft Gold Insulation Eco with 100% postconsumer recycled polyester.',
  price: '$249.00',
  category: 'Insulated Jackets',
  materials: '60-g PrimaLoft Gold Insulation Eco, 100% recycled polyester',
  image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw1234abcd/images/hi-res/84212_BLK.jpg'
};

const PALETTE = [];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

export default async function decorate(block, bridge) {
  let item;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      item = SAMPLE_DATA;
    } else {
      // Detail concept — structuredContent IS the item (flat). Do NOT look for a wrapper key.
      const _result = await bridge.toolResult;
      item = (_result?.structuredContent || _result) || {};
    }
  } else {
    item = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProduct(block, item, bridge);
  
  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderProduct(block, item, bridge) {
  if (!item || !item.name) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;
    
    const heading = document.createElement('h3');
    heading.textContent = 'No product found';
    empty.appendChild(heading);
    
    const text = document.createElement('p');
    text.textContent = 'Please enter a product name to view details.';
    empty.appendChild(text);
    
    block.appendChild(empty);
    return;
  }

  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Image container LEFT
  const imageContainer = document.createElement('div');
  imageContainer.className = 'product-image-container';
  
  const fallbackColor = CARD_COLORS[0];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };
  
  if (item.image_url) {
    const img = document.createElement('img');
    img.src = item.image_url;
    img.alt = item.name || 'Product image';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageContainer.appendChild(img);
  } else {
    imageContainer.appendChild(colorDiv());
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-button';
  ctaBtn.textContent = 'View Product';
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`Tell me more about ${item.name}`);
    });
  }
  imageContainer.appendChild(ctaBtn);

  card.appendChild(imageContainer);

  // Content RIGHT
  const content = document.createElement('div');
  content.className = 'product-content';
  content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = item.name;
  content.appendChild(name);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  if (item.price) {
    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = item.price;
    content.appendChild(price);
  }

  if (item.category) {
    const category = document.createElement('span');
    category.className = 'product-category';
    category.textContent = item.category;
    content.appendChild(category);
  }

  if (item.materials) {
    const materials = document.createElement('div');
    materials.className = 'product-materials';
    materials.textContent = item.materials;
    content.appendChild(materials);
  }

  card.appendChild(content);
  block.appendChild(card);
}