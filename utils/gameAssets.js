const GAME_ASSETS = {
    'meatball': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/50e1f49c-7376-43cd-8338-8ca311f7d992.png',
    'vegetable': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/d5f8d0f4-24c6-4ddf-9d7b-987091670448.png',
    'frozen_meat': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/52eb0327-93a1-4b7b-863b-2e1e97b08085.png',
    'meat': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/27945dca-0d64-4972-a21a-8f0fb6fa8354.png',
    'mushroom': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/f0705080-587e-4ffe-bdc4-e2e4e89f812b.png',
    'chili': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/9cc54f17-773a-48ab-9d9e-7e877041793b.png',
    'pepper': 'https://app.trickle.so/storage/public/images/usr_16cb4c3758000001/8aecf9cb-3c3e-45ae-b2aa-d2a8323b6099.png',
};

const loadedImages = {};

function loadGameAssets(callback) {
    let loadedCount = 0;
    const total = Object.keys(GAME_ASSETS).length;
    
    Object.keys(GAME_ASSETS).forEach(key => {
        const img = new Image();
        img.src = GAME_ASSETS[key];
        img.onload = () => {
            loadedImages[key] = img;
            loadedCount++;
            if (loadedCount === total && callback) {
                callback();
            }
        };
        img.onerror = () => {
             console.error(`Failed to load asset: ${key}`);
             // Still count it to avoid hanging, just won't render or will fallback
             loadedCount++;
             if (loadedCount === total && callback) {
                callback();
             }
        }
    });
}

function getAsset(key) {
    return loadedImages[key];
}

// Export to window for simple usage
window.GameAssets = {
    load: loadGameAssets,
    get: getAsset
};