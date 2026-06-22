// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
// synthetic fixture — no sample data available from Action Planner
const SAMPLE_DATA = [
  {
    name: 'Nano Puff Jacket',
    original_price: '$249',
    price: '$174',
    discount_percentage: '30% OFF',
    category: 'Jackets & Vests',
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'
  },
  {
    name: 'Better Sweater Fleece',
    original_price: '$139',
    price: '$97',
    discount_percentage: '30% OFF',
    category: 'Fleece',
    image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400'
  },
  {
    name: 'Capilene Thermal Weight Baselayer',
    original_price: '$79',
    price: '$55',
    discount_percentage: '30% OFF',
    category: 'Baselayers',
    image_url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400'
  }
];

const PALETTE = [];
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.deals — bare array outputSchema; key derived from actionName "get_current_deals"
      items = structuredContent?.deals || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDeals(block, items, bridge);

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

function renderDeals(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'deals-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'deals-carousel';

  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'deal-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'deal-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img);
      };
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    if (item.discount_percentage) {
      const badge = document.createElement('div');
      badge.className = 'discount-badge';
      badge.textContent = item.discount_percentage;
      imageContainer.appendChild(badge);
    }

    const cta = document.createElement('button');
    cta.className = 'deal-cta';
    cta.textContent = 'View Deal';
    if (bridge) {
      cta.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    imageContainer.appendChild(cta);

    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'deal-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'deal-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    const prices = document.createElement('div');
    prices.className = 'deal-prices';

    if (item.original_price) {
      const originalPrice = document.createElement('span');
      originalPrice.className = 'original-price';
      originalPrice.textContent = item.original_price;
      prices.appendChild(originalPrice);
    }

    if (item.price) {
      const salePrice = document.createElement('span');
      salePrice.className = 'sale-price';
      salePrice.textContent = item.price;
      prices.appendChild(salePrice);
    }

    info.appendChild(prices);
    card.appendChild(info);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  const leftBtn = document.createElement('button');
  leftBtn.className = 'nav-btn nav-left';
  leftBtn.setAttribute('aria-label', 'Scroll left');
  leftBtn.innerHTML = '◀';
  leftBtn.style.display = 'none';

  const rightBtn = document.createElement('button');
  rightBtn.className = 'nav-btn nav-right';
  rightBtn.setAttribute('aria-label', 'Scroll right');
  rightBtn.innerHTML = '▶';

  wrapper.appendChild(leftBtn);
  wrapper.appendChild(rightBtn);

  const fade = document.createElement('div');
  fade.className = 'scroll-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const updateNavButtons = () => {
    const scrollLeft = carousel.scrollLeft;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    leftBtn.style.display = scrollLeft > 5 ? 'flex' : 'none';
    rightBtn.style.display = scrollLeft < maxScroll - 5 ? 'flex' : 'none';
    fade.style.display = scrollLeft < maxScroll - 5 ? 'block' : 'none';
  };

  leftBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -220, behavior: 'smooth' });
  });

  rightBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: 220, behavior: 'smooth' });
  });

  carousel.addEventListener('scroll', updateNavButtons);
  updateNavButtons();

  block.appendChild(wrapper);
}