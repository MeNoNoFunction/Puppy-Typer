/* =========================================================
   PUPPY TYPIST - GAME DATA
   Add new items, quests, achievements and sentences here.
   Item "src" (how it unlocks) can be:
     { type: 'free' }
     { type: 'level', level: 5 }      unlocks automatically at that level
     { type: 'bones', cost: 150 }     buy it in the Wardrobe with bones
     { type: 'pass',  tier: 12 }      reward on the Paw Pass (claim it)
     { type: 'ach',   id: 'wpm_50' }  unlocks with that achievement
   The FIRST item in each category must be free (it's the default).
========================================================= */
window.PT_DATA = (() => {

    const CAT_META = [
        { id: 'breed', label: 'Breeds', icon: '🐶' },
        { id: 'coat', label: 'Coats', icon: '🐕' },
        { id: 'hat', label: 'Hats', icon: '🎩' },
        { id: 'neck', label: 'Neckwear', icon: '🧣' },
        { id: 'face', label: 'Glasses', icon: '🕶️' },
        { id: 'treat', label: 'Treats', icon: '🦴' },
        { id: 'trail', label: 'Trails', icon: '✨' },
        { id: 'scene', label: 'Scenes', icon: '🏞️' }
    ];

    const CATALOG = {
        breed: [
            { id: 'pup', name: 'Pup', icon: '🐶', src: { type: 'free' } },
            { id: 'retriever', name: 'Retriever', icon: '🦮', src: { type: 'level', level: 3 } },
            { id: 'corgi', name: 'Corgi', icon: '🐕', src: { type: 'bones', cost: 250 } },
            { id: 'dachshund', name: 'Dachshund', icon: '🌭', src: { type: 'bones', cost: 300 } },
            { id: 'pug', name: 'Pug', icon: '🐽', src: { type: 'level', level: 9 } },
            { id: 'husky', name: 'Husky', icon: '🐺', src: { type: 'pass', tier: 14 } },
            { id: 'poodle', name: 'Poodle', icon: '🐩', src: { type: 'bones', cost: 400 } },
            { id: 'whippet', name: 'Whippet', icon: '💨', src: { type: 'level', level: 14 } },
            { id: 'shiba', name: 'Shiba', icon: '🦊', src: { type: 'pass', tier: 22 } }
        ],
        coat: [
            { id: 'golden', name: 'Golden', fur: '#e8b04a', dark: '#c88a2a', light: '#f6d594', src: { type: 'free' } },
            { id: 'chocolate', name: 'Chocolate', fur: '#8b5a3c', dark: '#6b4128', light: '#b98a68', src: { type: 'level', level: 2 } },
            { id: 'silver', name: 'Silver', fur: '#a9b2bd', dark: '#7f8a97', light: '#d9dee4', src: { type: 'level', level: 4 } },
            { id: 'midnight', name: 'Midnight', fur: '#3a3d46', dark: '#24262c', light: '#5a5e69', src: { type: 'level', level: 6 } },
            { id: 'cream', name: 'Cream', fur: '#f3e3c3', dark: '#d9c398', light: '#fff5df', src: { type: 'level', level: 8 } },
            { id: 'candy', name: 'Cotton Candy', fur: '#f4a6c6', dark: '#d97fa6', light: '#ffd3e6', src: { type: 'level', level: 10 } },
            { id: 'sunset', name: 'Sunset', fur: '#ff8a6b', dark: '#e0587a', light: '#ffc7a8', grad: ['#ffb347', '#ff5e7e'], src: { type: 'level', level: 15 } },
            { id: 'mint', name: 'Mint', fur: '#8fe0b5', dark: '#5cbf8a', light: '#d4f7e4', src: { type: 'bones', cost: 150 } },
            { id: 'sky', name: 'Sky Blue', fur: '#8cc8f5', dark: '#5a9fd8', light: '#d3ebfc', src: { type: 'bones', cost: 150 } },
            { id: 'dalmatian', name: 'Dalmatian', fur: '#fafafa', dark: '#dcdcdc', light: '#ffffff', pattern: 'spots', patColor: '#222', src: { type: 'bones', cost: 300 } },
            { id: 'tiger', name: 'Tiger', fur: '#f29a3d', dark: '#d17a1f', light: '#ffd29a', pattern: 'stripes', patColor: '#5b3410', src: { type: 'bones', cost: 450 } },
            { id: 'pinto', name: 'Pinto', fur: '#f5efe6', dark: '#d9cdbb', light: '#fffaf2', pattern: 'patches', patColor: '#9c6b43', src: { type: 'pass', tier: 6 } },
            { id: 'galaxy', name: 'Galaxy', fur: '#2b2f6b', dark: '#1a1c47', light: '#4a4f9a', pattern: 'dots', patColor: '#fff6b0', src: { type: 'pass', tier: 20 } },
            { id: 'rainbow', name: 'Rainbow', fur: '#7e57c2', dark: '#5e3fa0', light: '#e8dcff', grad: ['#ff5252', '#ffb74d', '#fff176', '#81c784', '#64b5f6', '#ba68c8'], src: { type: 'pass', tier: 30 } },
            { id: 'ghost', name: 'Ghost', fur: '#eef3ff', dark: '#cdd7f2', light: '#ffffff', pattern: 'dots', patColor: '#b9c6ee', src: { type: 'ach', id: 'rounds_50' } },
            { id: 'strawberry', name: 'Strawberry', fur: '#ff7a96', dark: '#e0476c', light: '#ffc2d0', pattern: 'dots', patColor: '#fff3b0', src: { type: 'bones', cost: 200 } },
            { id: 'panda', name: 'Panda', fur: '#fafafa', dark: '#cfcfcf', light: '#ffffff', pattern: 'patches', patColor: '#25252b', src: { type: 'bones', cost: 350 } },
            { id: 'leopard', name: 'Leopard', fur: '#eab04a', dark: '#c98a22', light: '#ffe2a0', pattern: 'spots', patColor: '#5b3410', src: { type: 'bones', cost: 400 } },
            { id: 'frost', name: 'Frostbite', fur: '#bfe4fb', dark: '#7fb6e6', light: '#f0faff', grad: ['#f0faff', '#9ccdf5', '#f0faff'], src: { type: 'pass', tier: 11 } },
            { id: 'zebra', name: 'Zebra', fur: '#fafafa', dark: '#d4d4d4', light: '#ffffff', pattern: 'stripes', patColor: '#222', src: { type: 'level', level: 18 } },
            { id: 'ocean', name: 'Deep Ocean', fur: '#1e88b5', dark: '#14527a', light: '#8fe3f0', grad: ['#4dd0e1', '#1565c0', '#1a237e'], pattern: 'dots', patColor: '#d4fbff', src: { type: 'pass', tier: 26 } },
            { id: 'lava', name: 'Lava', fur: '#ff5722', dark: '#c62800', light: '#ffd180', grad: ['#ffb300', '#ff3d00', '#b71c1c'], pattern: 'dots', patColor: '#fff176', src: { type: 'bones', cost: 600 } },
            { id: 'neon', name: 'Neon', fur: '#39e83a', dark: '#12a815', light: '#c4ffb8', grad: ['#39e83a', '#00e5ff', '#d500f9'], src: { type: 'level', level: 25 } },
            { id: 'gold', name: 'Pure Gold', fur: '#f7c948', dark: '#d19a10', light: '#fff0a8', grad: ['#fff0a0', '#f2b01e', '#fff0a0'], src: { type: 'ach', id: 'wpm_80' } }
        ],
        hat: [
            { id: 'none', name: 'No Hat', icon: '🚫', src: { type: 'free' } },
            { id: 'party', name: 'Party Hat', icon: '🎉', src: { type: 'bones', cost: 100 } },
            { id: 'beanie', name: 'Beanie', icon: '🧶', src: { type: 'bones', cost: 150 } },
            { id: 'chef', name: 'Chef Hat', icon: '👨‍🍳', src: { type: 'bones', cost: 200 } },
            { id: 'cowboy', name: 'Cowboy Hat', icon: '🤠', src: { type: 'bones', cost: 250 } },
            { id: 'tophat', name: 'Top Hat', icon: '🎩', src: { type: 'bones', cost: 350 } },
            { id: 'santa', name: 'Santa Hat', icon: '🎅', src: { type: 'pass', tier: 9 } },
            { id: 'wizard', name: 'Wizard Hat', icon: '🧙', src: { type: 'pass', tier: 12 } },
            { id: 'halo', name: 'Halo', icon: '😇', src: { type: 'ach', id: 'perfects_5' } },
            { id: 'crown', name: 'Crown', icon: '👑', src: { type: 'ach', id: 'streak_100' } },
            { id: 'grad', name: 'Grad Cap', icon: '🎓', src: { type: 'level', level: 7 } },
            { id: 'pirate', name: 'Pirate Hat', icon: '🏴‍☠️', src: { type: 'bones', cost: 300 } },
            { id: 'headphones', name: 'Headphones', icon: '🎧', src: { type: 'bones', cost: 220 } },
            { id: 'bunny', name: 'Bunny Ears', icon: '🐰', src: { type: 'bones', cost: 180 } },
            { id: 'flower', name: 'Flower Crown', icon: '🌼', src: { type: 'pass', tier: 16 } },
            { id: 'viking', name: 'Viking Helm', icon: '⚔️', src: { type: 'bones', cost: 400 } },
            { id: 'propeller', name: 'Propeller Cap', icon: '🚁', src: { type: 'level', level: 13 } },
            { id: 'cap', name: 'Ball Cap', icon: '🧢', src: { type: 'bones', cost: 140 } },
            { id: 'sailor', name: 'Sailor Cap', icon: '⚓', src: { type: 'bones', cost: 200 } },
            { id: 'fez', name: 'Fez', icon: '🎩', src: { type: 'bones', cost: 230 } },
            { id: 'witch', name: 'Witch Hat', icon: '🧙‍♀️', src: { type: 'pass', tier: 8 } },
            { id: 'antlers', name: 'Reindeer Antlers', icon: '🦌', src: { type: 'pass', tier: 19 } },
            { id: 'tiara', name: 'Tiara', icon: '👸', src: { type: 'bones', cost: 330 } },
            { id: 'ninja', name: 'Ninja Band', icon: '🥷', src: { type: 'ach', id: 'wpm_60' } }
        ],
        neck: [
            { id: 'collar_red', name: 'Red Collar', icon: '🔴', src: { type: 'free' } },
            { id: 'bell', name: 'Jingle Bell', icon: '🔔', src: { type: 'bones', cost: 90 } },
            { id: 'collar_blue', name: 'Blue Collar', icon: '🔵', src: { type: 'bones', cost: 60 } },
            { id: 'collar_green', name: 'Green Collar', icon: '🟢', src: { type: 'bones', cost: 60 } },
            { id: 'bandana', name: 'Bandana', icon: '🏴‍☠️', src: { type: 'bones', cost: 120 } },
            { id: 'bowtie', name: 'Bow Tie', icon: '🎀', src: { type: 'bones', cost: 150 } },
            { id: 'chain', name: 'Gold Chain', icon: '⛓️', src: { type: 'level', level: 5 } },
            { id: 'spiked', name: 'Spiked Collar', icon: '⚫', src: { type: 'bones', cost: 250 } },
            { id: 'scarf', name: 'Cozy Scarf', icon: '🧣', src: { type: 'pass', tier: 15 } },
            { id: 'collar_rainbow', name: 'Rainbow Collar', icon: '🌈', src: { type: 'pass', tier: 24 } },
            { id: 'tie', name: 'Necktie', icon: '👔', src: { type: 'bones', cost: 180 } },
            { id: 'medal', name: 'Gold Medal', icon: '🥇', src: { type: 'ach', id: 'rounds_10' } },
            { id: 'lei', name: 'Flower Lei', icon: '🌺', src: { type: 'bones', cost: 200 } },
            { id: 'pearls', name: 'Pearl Necklace', icon: '🤍', src: { type: 'bones', cost: 220 } },
            { id: 'cape', name: 'Hero Cape', icon: '🦸', src: { type: 'pass', tier: 28 } },
            { id: 'collar_pink', name: 'Pink Collar', icon: '🩷', src: { type: 'bones', cost: 60 } },
            { id: 'collar_gold', name: 'Gold Collar', icon: '🟡', src: { type: 'bones', cost: 200 } },
            { id: 'bandana_blue', name: 'Blue Bandana', icon: '🔷', src: { type: 'bones', cost: 120 } },
            { id: 'ribbon', name: 'Gift Ribbon', icon: '🎁', src: { type: 'bones', cost: 100 } },
            { id: 'dogtag', name: 'Big Dog Tag', icon: '🏷️', src: { type: 'level', level: 7 } },
            { id: 'daisies', name: 'Daisy Chain', icon: '🌼', src: { type: 'bones', cost: 160 } },
            { id: 'snowflake', name: 'Snowflake Charm', icon: '❄️', src: { type: 'pass', tier: 29 } }
        ],
        face: [
            { id: 'none', name: 'No Glasses', icon: '🚫', src: { type: 'free' } },
            { id: 'nerd', name: 'Nerd Glasses', icon: '🤓', src: { type: 'bones', cost: 120 } },
            { id: 'hearts', name: 'Heart Shades', icon: '😍', src: { type: 'bones', cost: 200 } },
            { id: 'sunglasses', name: 'Cool Shades', icon: '😎', src: { type: 'ach', id: 'wpm_50' } },
            { id: 'monocle', name: 'Monocle', icon: '🧐', src: { type: 'bones', cost: 260 } },
            { id: 'stars', name: 'Star Shades', icon: '🤩', src: { type: 'bones', cost: 300 } },
            { id: 'goggles', name: 'Aviator Goggles', icon: '🥽', src: { type: 'level', level: 9 } },
            { id: 'eyepatch', name: 'Eye Patch', icon: '🏴‍☠️', src: { type: 'bones', cost: 180 } },
            { id: 'hero', name: 'Hero Mask', icon: '🦸', src: { type: 'pass', tier: 7 } },
            { id: 'round', name: 'Round Specs', icon: '👓', src: { type: 'bones', cost: 100 } },
            { id: 'threed', name: '3D Glasses', icon: '🎬', src: { type: 'pass', tier: 21 } },
            { id: 'vr', name: 'VR Headset', icon: '🥽', src: { type: 'bones', cost: 320 } },
            { id: 'bandit', name: 'Bandit Mask', icon: '🦝', src: { type: 'ach', id: 'night_owl' } }
        ],
        treat: [
            { id: 'bone', name: 'Bone', icon: '🦴', src: { type: 'free' } },
            { id: 'cookie', name: 'Cookie', icon: '🍪', src: { type: 'bones', cost: 80 } },
            { id: 'cheese', name: 'Cheese', icon: '🧀', src: { type: 'bones', cost: 100 } },
            { id: 'hotdog', name: 'Hot Dog', icon: '🌭', src: { type: 'bones', cost: 120 } },
            { id: 'donut', name: 'Donut', icon: '🍩', src: { type: 'bones', cost: 150 } },
            { id: 'burger', name: 'Burger', icon: '🍔', src: { type: 'bones', cost: 200 } },
            { id: 'pizza', name: 'Pizza', icon: '🍕', src: { type: 'level', level: 3 } },
            { id: 'steak', name: 'Steak', icon: '🥩', src: { type: 'pass', tier: 4 } },
            { id: 'cake', name: 'Birthday Cake', icon: '🍰', src: { type: 'pass', tier: 27 } },
            { id: 'fries', name: 'Fries', icon: '🍟', src: { type: 'bones', cost: 90 } },
            { id: 'icecream', name: 'Ice Cream', icon: '🍦', src: { type: 'bones', cost: 100 } },
            { id: 'taco', name: 'Taco', icon: '🌮', src: { type: 'bones', cost: 120 } },
            { id: 'melon', name: 'Watermelon', icon: '🍉', src: { type: 'bones', cost: 110 } },
            { id: 'cupcake', name: 'Cupcake', icon: '🧁', src: { type: 'bones', cost: 160 } },
            { id: 'pancakes', name: 'Pancakes', icon: '🥞', src: { type: 'bones', cost: 180 } },
            { id: 'popcorn', name: 'Popcorn', icon: '🍿', src: { type: 'level', level: 6 } },
            { id: 'sushi', name: 'Sushi', icon: '🍣', src: { type: 'level', level: 18 } }
        ],
        trail: [
            { id: 'none', name: 'No Trail', icon: '🚫', src: { type: 'free' } },
            { id: 'dust', name: 'Dust Cloud', icon: '💨', src: { type: 'bones', cost: 80 } },
            { id: 'hearts', name: 'Hearts', icon: '❤️', src: { type: 'bones', cost: 150 } },
            { id: 'petals', name: 'Petals', icon: '🌸', src: { type: 'bones', cost: 200 } },
            { id: 'stars', name: 'Stars', icon: '⭐', src: { type: 'level', level: 12 } },
            { id: 'snow', name: 'Snowflakes', icon: '❄️', src: { type: 'pass', tier: 18 } },
            { id: 'rainbow', name: 'Rainbow', icon: '🌈', src: { type: 'pass', tier: 25 } },
            { id: 'flames', name: 'Flames', icon: '🔥', src: { type: 'ach', id: 'streak_50' } },
            { id: 'paws', name: 'Paw Prints', icon: '🐾', src: { type: 'bones', cost: 100 } },
            { id: 'leaves', name: 'Leaves', icon: '🍃', src: { type: 'bones', cost: 120 } },
            { id: 'bubbles', name: 'Bubbles', icon: '🫧', src: { type: 'bones', cost: 140 } },
            { id: 'music', name: 'Music Notes', icon: '🎵', src: { type: 'bones', cost: 160 } },
            { id: 'confetti', name: 'Confetti', icon: '🎊', src: { type: 'level', level: 17 } },
            { id: 'lightning', name: 'Lightning', icon: '⚡', src: { type: 'ach', id: 'combo_25' } }
        ],
        scene: [
            { id: 'meadow', name: 'Sunny Meadow', skyTop: '#8fd3ff', skyBot: '#e3f6ff', hill: '#9bdc84', ground: '#78c850', edge: '#5fae3c', stripe: 'rgba(0,0,0,0.09)', decor: '☁️', src: { type: 'free' } },
            { id: 'autumn', name: 'Autumn Trail', skyTop: '#ffb27a', skyBot: '#ffe8cf', hill: '#e69a4a', ground: '#c9822f', edge: '#a8651b', stripe: 'rgba(0,0,0,0.12)', decor: '🍂', src: { type: 'level', level: 5 } },
            { id: 'beach', name: 'Sandy Beach', skyTop: '#6cc9ff', skyBot: '#d9f3ff', hill: '#7fd1e8', ground: '#f3dc9d', edge: '#e0c373', stripe: 'rgba(0,0,0,0.07)', decor: '☁️', src: { type: 'bones', cost: 200 } },
            { id: 'snow', name: 'Snowy Hills', skyTop: '#b9d7ee', skyBot: '#f2f8fc', hill: '#dcecf7', ground: '#ffffff', edge: '#d3e4f0', stripe: 'rgba(120,160,200,0.18)', decor: '❄️', src: { type: 'bones', cost: 250 } },
            { id: 'night', name: 'Starry Night', skyTop: '#0b1d3a', skyBot: '#34467f', hill: '#2f5a45', ground: '#26402f', edge: '#1c3022', stripe: 'rgba(255,255,255,0.07)', decor: '⭐', src: { type: 'level', level: 11 } },
            { id: 'candy', name: 'Candy Land', skyTop: '#ffc2e2', skyBot: '#fff0f7', hill: '#ffb0d6', ground: '#ff9ccb', edge: '#ee7fb4', stripe: 'rgba(255,255,255,0.3)', decor: '🍭', src: { type: 'pass', tier: 10 } },
            { id: 'space', name: 'Outer Space', skyTop: '#05001a', skyBot: '#2b0a4a', hill: '#4a2a7a', ground: '#3b2266', edge: '#2a1650', stripe: 'rgba(255,255,255,0.08)', decor: '✨', src: { type: 'level', level: 20 } },
            { id: 'desert', name: 'Desert Mesa', skyTop: '#ffc58a', skyBot: '#fff0d6', hill: '#e3a86a', ground: '#e8b565', edge: '#c9923f', stripe: 'rgba(120,60,0,0.12)', decor: '🌵', src: { type: 'bones', cost: 300 } },
            { id: 'jungle', name: 'Jungle', skyTop: '#9fe6c0', skyBot: '#eaffe6', hill: '#3b9459', ground: '#2e8a4a', edge: '#1f6a35', stripe: 'rgba(0,0,0,0.12)', decor: '🌴', src: { type: 'level', level: 16 } },
            { id: 'sakura', name: 'Cherry Blossom', skyTop: '#ffc9dc', skyBot: '#fff3f7', hill: '#f6a8c4', ground: '#9ed38a', edge: '#7fbd6c', stripe: 'rgba(0,0,0,0.08)', decor: '🌸', src: { type: 'bones', cost: 350 } },
            { id: 'spooky', name: 'Spooky Night', skyTop: '#1b1033', skyBot: '#5b2a6e', hill: '#3a2158', ground: '#3b2a4f', edge: '#271a38', stripe: 'rgba(255,255,255,0.06)', decor: '🎃', src: { type: 'level', level: 22 } }
        ]
    };

    const DIFFS = {
        easy: { label: 'Easy – short & simple', mult: 1, unlock: 1 },
        medium: { label: 'Medium – longer sentences', mult: 1.3, unlock: 1 },
        hard: { label: 'Hard – commas, capitals & punctuation', mult: 1.7, unlock: 1 },
        expert: { label: 'Expert – double-length challenge', mult: 2.2, unlock: 8 }
    };

    const TITLES = [
        [1, 'Tiny Pup'], [3, 'Playful Pup'], [5, 'Good Pup'], [8, 'Speedy Dog'],
        [12, 'Typing Hound'], [16, 'Top Dog'], [20, 'Legendary Doggo'],
        [25, 'Keyboard King'], [30, 'Paw-fessor']
    ];

    /* ---------- Daily quest pool (3 distinct types picked per day) ---------- */
    const QUEST_POOL = [
        { type: 'rounds', target: 2, text: 'Finish 2 rounds', bones: 40, pxp: 60 },
        { type: 'rounds', target: 4, text: 'Finish 4 rounds', bones: 70, pxp: 100 },
        { type: 'chars', target: 300, text: 'Type 300 correct letters', bones: 40, pxp: 60 },
        { type: 'chars', target: 800, text: 'Type 800 correct letters', bones: 70, pxp: 100 },
        { type: 'acc', target: 95, text: 'Finish a round with 95%+ accuracy', bones: 50, pxp: 80 },
        { type: 'acc', target: 98, text: 'Finish a round with 98%+ accuracy', bones: 70, pxp: 100 },
        { type: 'wpm', target: 25, text: 'Reach 25 WPM in a round', bones: 40, pxp: 60 },
        { type: 'wpm', target: 40, text: 'Reach 40 WPM in a round', bones: 70, pxp: 100 },
        { type: 'streak', target: 30, text: 'Type 30 letters in a row with no mistakes', bones: 40, pxp: 60 },
        { type: 'streak', target: 60, text: 'Type 60 letters in a row with no mistakes', bones: 70, pxp: 100 },
        { type: 'perfect', target: 1, text: 'Finish a round with ZERO mistakes', bones: 80, pxp: 120 },
        { type: 'tough', target: 1, text: 'Finish a Medium, Hard or Expert round', bones: 50, pxp: 80 }
    ];

    /* ---------- Achievements (check receives the save object) ---------- */
    const ACHIEVEMENTS = [
        { id: 'first_round', name: 'First Fetch', desc: 'Finish your first round', bones: 25, check: s => s.games >= 1 },
        { id: 'rounds_10', name: 'Regular', desc: 'Finish 10 rounds', bones: 50, check: s => s.games >= 10 },
        { id: 'rounds_50', name: 'Dedicated Trainer', desc: 'Finish 50 rounds', bones: 150, check: s => s.games >= 50 },
        { id: 'wpm_30', name: 'Quick Paws', desc: 'Reach 30 WPM in a round', bones: 40, check: s => s.bestWpm >= 30 },
        { id: 'wpm_50', name: 'Speedy Pup', desc: 'Reach 50 WPM in a round', bones: 80, check: s => s.bestWpm >= 50 },
        { id: 'wpm_80', name: 'Lightning Dog', desc: 'Reach 80 WPM in a round', bones: 200, check: s => s.bestWpm >= 80 },
        { id: 'acc_100', name: 'Flawless', desc: 'Finish a round with 0 mistakes', bones: 60, check: s => s.perfects >= 1 },
        { id: 'perfects_5', name: 'Perfectionist', desc: 'Finish 5 rounds with 0 mistakes', bones: 120, check: s => s.perfects >= 5 },
        { id: 'streak_50', name: 'On a Roll', desc: 'Type 50 letters in a row, no mistakes', bones: 80, check: s => s.maxStreak >= 50 },
        { id: 'streak_100', name: 'Unstoppable', desc: 'Type 100 letters in a row, no mistakes', bones: 150, check: s => s.maxStreak >= 100 },
        { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', bones: 50, check: s => s.level >= 5 },
        { id: 'level_10', name: 'Top of the Pack', desc: 'Reach level 10', bones: 100, check: s => s.level >= 10 },
        { id: 'level_20', name: 'Legend', desc: 'Reach level 20', bones: 250, check: s => s.level >= 20 },
        { id: 'chars_1000', name: 'Thousand Letters', desc: 'Type 1,000 correct letters', bones: 50, check: s => s.totalChars >= 1000 },
        { id: 'chars_10000', name: 'Ten Thousand Club', desc: 'Type 10,000 correct letters', bones: 200, check: s => s.totalChars >= 10000 },
        { id: 'hard_5', name: 'Challenge Accepted', desc: 'Finish 5 Medium+ rounds', bones: 80, check: s => s.hardRounds >= 5 },
        { id: 'daily_3', name: 'Loyal Friend', desc: 'Visit 3 days in a row', bones: 60, check: s => s.daily.streak >= 3 },
        { id: 'daily_7', name: 'Best Friends', desc: 'Visit 7 days in a row', bones: 150, check: s => s.daily.streak >= 7 },
        { id: 'wpm_60', name: 'Rocket Paws', desc: 'Reach 60 WPM in a round', bones: 120, check: s => s.bestWpm >= 60 },
        { id: 'wpm_100', name: 'Sonic Boom', desc: 'Reach 100 WPM in a round', bones: 300, check: s => s.bestWpm >= 100 },
        { id: 'rounds_100', name: 'Century Club', desc: 'Finish 100 rounds', bones: 250, check: s => s.games >= 100 },
        { id: 'rounds_250', name: 'Kennel Master', desc: 'Finish 250 rounds', bones: 500, check: s => s.games >= 250 },
        { id: 'level_15', name: 'Pack Leader', desc: 'Reach level 15', bones: 150, check: s => s.level >= 15 },
        { id: 'level_25', name: 'Hall of Fame', desc: 'Reach level 25', bones: 350, check: s => s.level >= 25 },
        { id: 'level_30', name: 'Paw-fessor', desc: 'Reach level 30', bones: 500, check: s => s.level >= 30 },
        { id: 'chars_50000', name: 'Novelist', desc: 'Type 50,000 correct letters', bones: 400, check: s => s.totalChars >= 50000 },
        { id: 'perfects_25', name: 'Pawfection', desc: 'Finish 25 rounds with 0 mistakes', bones: 300, check: s => s.perfects >= 25 },
        { id: 'streak_200', name: 'Untouchable', desc: 'Type 200 letters in a row, no mistakes', bones: 300, check: s => s.maxStreak >= 200 },
        { id: 'combo_10', name: 'Combo Starter', desc: 'Get a x10 word combo', bones: 80, check: s => s.bestCombo >= 10 },
        { id: 'combo_25', name: 'Combo King', desc: 'Get a x25 word combo', bones: 200, check: s => s.bestCombo >= 25 },
        { id: 'expert_1', name: 'Expert Trial', desc: 'Finish an Expert round', bones: 100, check: s => s.diffsPlayed.includes('expert') },
        { id: 'all_diffs', name: 'Jack of All Trades', desc: 'Finish a round on every difficulty', bones: 200, check: s => ['easy', 'medium', 'hard', 'expert'].every(d => s.diffsPlayed.includes(d)) },
        { id: 'custom_1', name: "Teacher's Pet", desc: 'Finish a round with your own sentences', bones: 60, check: s => s.customRounds >= 1 },
        { id: 'night_owl', name: 'Night Owl', desc: 'Finish a round between midnight and 5am', bones: 80, check: s => s.nightRounds >= 1 },
        { id: 'early_bird', name: 'Early Bird', desc: 'Finish a round between 5am and 8am', bones: 80, check: s => s.morningRounds >= 1 },
        { id: 'daily_14', name: 'Two Week Pals', desc: 'Visit 14 days in a row', bones: 300, check: s => s.daily.streak >= 14 },
        { id: 'daily_30', name: 'Forever Friends', desc: 'Visit 30 days in a row', bones: 800, check: s => s.daily.streak >= 30 },
        { id: 'quests_10', name: 'Quest Hunter', desc: 'Complete 10 daily quests', bones: 100, check: s => s.questsDone >= 10 },
        { id: 'quests_50', name: 'Quest Master', desc: 'Complete 50 daily quests', bones: 400, check: s => s.questsDone >= 50 },
        { id: 'ta_1', name: 'Beat the Clock', desc: 'Finish a Time Attack round', bones: 60, check: s => s.taRounds >= 1 },
        { id: 'ta_10', name: 'Time Master', desc: 'Finish 10 sentences in one Time Attack', bones: 250, check: s => s.taBest >= 10 },
        { id: 'quick_round', name: 'Quick Draw', desc: 'Finish a 5+ sentence round in under 25 seconds with 90%+ accuracy', bones: 150, check: s => s.quickRound >= 1 },
        { id: 'time_10m', name: 'Warming Up', desc: 'Spend 10 minutes typing', bones: 60, check: s => s.totalTime >= 600 },
        { id: 'time_1h', name: 'Marathon Runner', desc: 'Spend 1 hour typing', bones: 250, check: s => s.totalTime >= 3600 },
        { id: 'own_30', name: 'Collector', desc: 'Unlock 30 items', bones: 100, check: (s, c) => c.owned >= 30 },
        { id: 'own_60', name: 'Hoarder', desc: 'Unlock 60 items', bones: 250, check: (s, c) => c.owned >= 60 },
        { id: 'own_100', name: 'Walking Museum', desc: 'Unlock 100 items', bones: 500, check: (s, c) => c.owned >= 100 },
        { id: 'pass_10', name: 'Pass Climber', desc: 'Reach Paw Pass tier 10', bones: 100, check: (s, c) => c.passTier >= 10 },
        { id: 'pass_30', name: 'Season Complete', desc: 'Reach Paw Pass tier 30', bones: 400, check: (s, c) => c.passTier >= 30 },
        { id: 'lucky_5', name: 'Lucky Dog', desc: 'Open 5 Mystery Boxes', bones: 100, check: s => s.mysteryOpened >= 5 },
        { id: 'gifts_7', name: 'Daily Treat', desc: 'Claim the daily reward 7 times', bones: 120, check: s => s.dailyClaims >= 7 }
    ];

    /* ---------- Sentence generator (grammar-safe templates) ---------- */
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const article = w => (/^[aeiou]/i.test(w) ? 'an' : 'a');

    const adj = ['happy', 'tiny', 'brave', 'sleepy', 'clever', 'fluffy', 'gentle', 'quick', 'curious', 'friendly', 'eager', 'old'];
    const animal = ['dog', 'cat', 'bird', 'rabbit', 'fox', 'turtle', 'horse', 'duck', 'frog', 'bear'];
    const place = ['garden', 'park', 'barn', 'kitchen', 'river', 'forest', 'school', 'bridge', 'hill'];
    const pastVerb = ['ran', 'jumped', 'walked', 'played', 'slept', 'waited', 'hid', 'rested'];
    const prep = ['near', 'behind', 'beside', 'in', 'by'];
    const names = ['Maya', 'Leo', 'Priya', 'Sam', 'Ava', 'Noah', 'Zoe', 'Ethan', 'Lily', 'Omar'];

    const easyTemplates = [
        () => `The ${pick(adj)} ${pick(animal)} ${pick(pastVerb)} ${pick(prep)} the ${pick(place)}.`,
        () => { const a = pick(adj); return `${cap(article(a))} ${a} ${pick(animal)} lives near the ${pick(place)}.`; },
        () => { const a = pick(adj); return `${pick(names)} has ${article(a)} ${a} ${pick(animal)}.`; },
        () => `We can see the ${pick(animal)} from the ${pick(place)}.`,
        () => `The ${pick(animal)} likes to ${pick(['run', 'play', 'swim', 'jump', 'nap', 'hide'])} in the ${pick(place)}.`,
        () => `${pick(names)} fed the ${pick(animal)} before school.`,
        () => `Look at the ${pick(adj)} ${pick(animal)} by the ${pick(place)}!`
    ];

    const activities = ['read books', 'play soccer', 'paint pictures', 'bake cookies', 'ride a bike', 'build model boats', 'walk the dog'];
    const whens = ['after school', 'on sunny days', 'every weekend', 'in the evening'];
    const chores = ['carried the groceries', 'painted the fence', 'cleaned the garage', 'fixed the broken bike', 'built a tiny birdhouse', 'found a lost kitten'];
    const chorewhen = ['yesterday afternoon', 'before dinner', 'on Saturday morning', 'with great care'];
    const rainPlans = ['stay home and bake cookies', 'read in the library', 'watch a movie together', 'play board games'];

    const mediumTemplates = [
        () => `${pick(names)} likes to ${pick(activities)} ${pick(whens)}.`,
        () => `If it rains tomorrow, we will ${pick(rainPlans)}.`,
        () => { const a = pick(names); let b = pick(names); while (b === a) b = pick(names); return `${a} and ${b} ${pick(chores)} ${pick(chorewhen)}.`; },
        () => `The ${pick(adj)} ${pick(animal)} ${pick(pastVerb)} ${pick(prep)} the ${pick(place)} ${pick(whens)}.`,
        () => `${pick(names)} wants to learn how to ${pick(['swim', 'cook', 'draw', 'code', 'play the piano'])} this year.`,
        () => `Every morning, the ${pick(animal)} waits ${pick(prep)} the ${pick(place)} for ${pick(names)}.`
    ];

    const hardBank = [
        'The quick brown fox jumps over the lazy dog.',
        'Practice makes progress, not perfection.',
        "Don't forget to check your spelling, punctuation, and capital letters.",
        "On Tuesday, Mr. Garcia's class visited the museum, the library, and the zoo.",
        "It's important to take a deep breath before you begin.",
        'Our team scored 24 points, but we still had a wonderful time.',
        'If you work hard every day, you will surely improve.',
        'Whenever the weather turns cold, Grandma bakes warm apple bread.',
        "Wow! That was the fastest lap I've ever seen.",
        'Where did you put the red notebook, the blue pencil, and my glasses?',
        'Slow and steady wins the race, but fast and accurate wins the treat.',
        "After dinner, Mia's puppy chased a ball across the yard and rolled in the grass.",
        "The library opens at 9 o'clock, and it closes at 5 o'clock.",
        'Although the hike was long, the view from the top was worth every step.',
        "Our neighbor's garden has tomatoes, peppers, sunflowers, and tall green beans.",
        'Please remember: a clear mind and calm fingers make fewer mistakes.',
        'When the bell rang at 3:30, everyone grabbed their backpacks and hurried outside.',
        "I can't believe how many stars we saw last night, can you?",
        'First, mix the flour and eggs; then, add the milk slowly.',
        "Dr. Patel said that drinking water, sleeping well, and exercising are all important."
    ];
    const weather = ['raining', 'cold and windy', 'almost dark', 'very late'];
    const hardActs = ['go for a walk', 'finish the puzzle', 'practice typing', 'visit the park'];
    const hardTemplates = [
        () => `Although it was ${pick(weather)}, ${pick(names)} decided to ${pick(hardActs)}.`,
        () => pick(hardBank), () => pick(hardBank), () => pick(hardBank)
    ];

    function generateSentences(difficulty, count) {
        const pool = difficulty === 'easy' ? easyTemplates
            : difficulty === 'medium' ? mediumTemplates
                : hardTemplates;
        const used = new Set();
        const out = [];
        let guard = 0;
        while (out.length < count && guard++ < count * 60) {
            let s;
            if (difficulty === 'expert') {
                s = pick(hardTemplates)() + ' ' + pick(hardTemplates)();
            } else {
                s = pick(pool)();
            }
            if (!used.has(s)) { used.add(s); out.push(s); }
        }
        return out;
    }

    return { CAT_META, CATALOG, DIFFS, TITLES, QUEST_POOL, ACHIEVEMENTS, generateSentences };
})();


/* =========================================================
   BADGES: shown on the Profile (Stats tab), the Account card and the account menu.
   To add one: add an entry here + a drawing in BADGE_ART below.
   Season badges are granted automatically from the player's 'seasons' list (see script.js).
========================================================= */
const BADGE_CATEGORIES = [
    { id: 'season', label: 'Season badges', blurb: 'Earned by playing a Paw Pass season. They never go away, even after the season ends.' }
];
const BADGES = [
    { id: 'season_s1', cat: 'season', name: 'Season 1: Backyard Bash', desc: 'Played the very first Paw Pass season.', how: 'Earn Paw Pass XP during Season 1: Backyard Bash.' }
];
const BADGE_ART = {
    season_s1: `<polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="#ffb300" stroke="#2b2b2b" stroke-width="3.5" stroke-linejoin="round"/>
    <polygon points="32,9 52,20.5 52,43.5 32,55 12,43.5 12,20.5" fill="#ffd54f"/>
    <g fill="#fff" stroke="#2b2b2b" stroke-width="1.7" stroke-linejoin="round">
      <rect x="15" y="40.5" width="36" height="3" rx="1"/><rect x="15" y="46" width="36" height="3" rx="1"/>
      <path d="M17 51 V38.5 L20.2 34.5 L23.4 38.5 V51 Z"/><path d="M25.7 51 V38.5 L28.9 34.5 L32.1 38.5 V51 Z"/><path d="M34.4 51 V38.5 L37.6 34.5 L40.8 38.5 V51 Z"/><path d="M43.1 51 V38.5 L46.3 34.5 L49.5 38.5 V51 Z"/>
    </g>
    <g transform="translate(0,-4)"><g stroke="#2b2b2b" stroke-width="2.2" fill="#fffdf2"><circle cx="21.5" cy="24" r="3.5"/><circle cx="21.5" cy="30.5" r="3.5"/><circle cx="42.5" cy="24" r="3.5"/><circle cx="42.5" cy="30.5" r="3.5"/><rect x="22" y="23.5" width="20" height="7.5" rx="3"/></g>
    <rect x="22" y="24.6" width="20" height="5.3" fill="#fffdf2"/><circle cx="21.5" cy="24" r="2.4" fill="#fffdf2"/><circle cx="21.5" cy="30.5" r="2.4" fill="#fffdf2"/><circle cx="42.5" cy="24" r="2.4" fill="#fffdf2"/><circle cx="42.5" cy="30.5" r="2.4" fill="#fffdf2"/></g>
    <path d="M50 17 l1.3 3 3 1.3 -3 1.3 -1.3 3 -1.3 -3 -3 -1.3 3 -1.3z" fill="#fff" stroke="#2b2b2b" stroke-width="1.4" stroke-linejoin="round"/>`
};