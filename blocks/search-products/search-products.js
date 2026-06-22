// synthetic fixture — no sample data available from Action Planner
const SAMPLE_DATA = [
  { name: "Men's Torrentshell 3L Rain Jacket", price: "€165", category: "Jackets & Vests", url: "https://eu.patagonia.com/product/12345", image_url: "https://eu.patagonia.com/images/jacket1.jpg" },
  { name: "Men's Better Sweater Fleece Jacket", price: "€135", category: "Fleece", url: "https://eu.patagonia.com/product/23456", image_url: "https://eu.patagonia.com/images/jacket2.jpg" },
  { name: "Men's Nano Puff Jacket", price: "€220", category: "Jackets & Vests", url: "https://eu.patagonia.com/product/34567", image_url: "https://eu.patagonia.com/images/jacket3.jpg" }
];

const PALETTE = [];
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if(hex.length!==6)return null;
  let [r,g,b]=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  if(isNaN(r)||isNaN(g)||isNaN(b))return null;
  const lum=(c)=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
  const relLum=(r,g,b)=>0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if(relLum(r,g,b)<=0.12)return{bg:`#${hex}`,fg:'#ffffff'};
  let lo=0,hi=1;
  for(let i=0;i<20;i++){const m=(lo+hi)/2;if(relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m))>0.12)hi=m;else lo=m;}
  const dr=Math.round(r*lo),dg=Math.round(g*lo),db=Math.round(b*lo);
  return{bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,fg:'#ffffff'};
}
const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let products;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      products = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.products — bare array outputSchema; key derived from actionName "search_products"
      products = structuredContent?.products || [];
    }
  } else {
    products = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!products || products.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderCarousel(block, products, bridge);
  }

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

function renderEmptyState(block, bridge) {
  const emptyCard = document.createElement('div');
  emptyCard.className = 'empty-state';
  emptyCard.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const heading = document.createElement('h3');
  heading.textContent = 'Search for outdoor gear';
  emptyCard.appendChild(heading);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter search term...';
  input.className = 'search-input';
  emptyCard.appendChild(input);

  const chipsContainer = document.createElement('div');
  chipsContainer.className = 'category-chips';
  const categories = ['Jackets', 'Fleece', 'Baselayers', 'Backpacks', 'Wetsuits'];
  categories.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'category-chip';
    chip.textContent = cat;
    if (bridge) {
      chip.addEventListener('click', () => {
        bridge.sendMessage(`Show me ${cat.toLowerCase()}`);
      });
    }
    chipsContainer.appendChild(chip);
  });
  emptyCard.appendChild(chipsContainer);

  const searchBtn = document.createElement('button');
  searchBtn.className = 'search-btn';
  searchBtn.textContent = 'Search';
  if (bridge) {
    searchBtn.addEventListener('click', () => {
      const query = input.value.trim();
      if (query) {
        bridge.sendMessage(`Search for ${query}`);
      }
    });
  }
  emptyCard.appendChild(searchBtn);

  block.appendChild(emptyCard);
}

function renderCarousel(block, products, bridge) {
  const container = document.createElement('div');
  container.className = 'carousel-container';

  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'carousel-scroll';

  products.forEach((product, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (product.image_url) {
      const img = document.createElement('img');
      img.src = product.image_url;
      img.alt = product.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(colorDiv(), img);
        }
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-btn';
    ctaBtn.textContent = 'Shop Now';
    if (bridge && product.url) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${product.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'product-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = product.name || '';
    info.appendChild(name);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'product-bottom';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = product.price || '';
    bottomRow.appendChild(price);

    if (product.category) {
      const badge = document.createElement('span');
      badge.className = 'product-badge';
      badge.textContent = product.category;
      bottomRow.appendChild(badge);
    }

    info.appendChild(bottomRow);
    card.appendChild(info);
    scrollWrapper.appendChild(card);
  });

  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel-arrow left';
  leftArrow.innerHTML = '◀';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel-arrow right';
  rightArrow.innerHTML = '▶';
  rightArrow.setAttribute('aria-label', 'Scroll right');

  const updateArrows = () => {
    const isAtStart = scrollWrapper.scrollLeft <= 0;
    const isAtEnd = scrollWrapper.scrollLeft + scrollWrapper.clientWidth >= scrollWrapper.scrollWidth - 1;
    leftArrow.style.display = isAtStart ? 'none' : 'block';
    rightArrow.style.display = isAtEnd ? 'none' : 'block';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    scrollWrapper.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  scrollWrapper.addEventListener('scroll', updateArrows);
  setTimeout(updateArrows, 100);

  const fade = document.createElement('div');
  fade.className = 'carousel-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;

  container.appendChild(scrollWrapper);
  container.appendChild(fade);
  container.appendChild(leftArrow);
  container.appendChild(rightArrow);
  block.appendChild(container);
}