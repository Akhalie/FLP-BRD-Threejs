export class ShopScreen {
  constructor(game) {
    this.game = game;

    this.root = document.createElement('div');
    this.root.className = 'screen shop-screen';

    this.root.innerHTML = `
      <div class="panel shop-panel">
        <h2 class="title">SHOP</h2>

        <div class="shop-wallet">
          <span aria-hidden="true">🪙</span> <span data-wallet>0</span>
        </div>

        <div class="shop-grid" data-grid></div>

        <button class="btn btn-secondary" data-close>
          Back
        </button>
      </div>
    `;

    this.walletLabel = this.root.querySelector('[data-wallet]');
    this.grid = this.root.querySelector('[data-grid]');

    this.root
      .querySelector('[data-close]')
      .addEventListener('click', () => {
        this.game.audioManager.playUiClick();
        this.hide();
        this.game.uiManager.mainMenu.show();
      });

    this.game.emitter.on('walletChanged', () => this.refresh());
    this.game.emitter.on('shopChanged', () => this.refresh());

    this.refresh();
  }

  show() {
    this.refresh();
    this.root.classList.add('visible');
  }

  hide() {
    this.root.classList.remove('visible');
  }

  refresh() {
    this.walletLabel.textContent = this.game.coinSystem.total;

    this.grid.innerHTML = '';

    const skins = this.game.shopSystem.getSkins();

    skins.forEach((skin) => {
      const card = document.createElement('div');
      card.className = 'shop-card';
      if (!skin.unlocked) card.classList.add('locked');
      if (skin.equipped) card.classList.add('equipped');

      if (skin.equipped) {
        const badge = document.createElement('div');
        badge.className = 'shop-card-badge';
        badge.textContent = 'EQUIPPED';
        card.appendChild(badge);
      }

      const preview = document.createElement('div');
      preview.className = 'shop-preview';
      preview.style.background = '#' + skin.color.toString(16).padStart(6, '0');

      if (!skin.unlocked) {
        const lock = document.createElement('div');
        lock.className = 'shop-lock';
        lock.textContent = '🔒';
        lock.setAttribute('aria-hidden', 'true');
        card.appendChild(lock);
      }

      const title = document.createElement('h3');
      title.textContent = skin.name;

      const price = document.createElement('p');

      if (skin.cost === 0) {
        price.textContent = 'Free';
      } else {
        price.textContent = `${skin.cost} Coins`;
      }

      const button = document.createElement('button');
      button.className = 'btn';

      if (skin.equipped) {
        button.textContent = 'Equipped';
        button.disabled = true;
      } else if (skin.unlocked) {
        button.textContent = 'Equip';

        button.addEventListener('click', () => {
          this.game.audioManager.playUiClick();
          this.game.shopSystem.equip(skin.id);
        });
      } else {
        button.textContent = `Buy (${skin.cost})`;

        if (!this.game.shopSystem.canAfford(skin)) {
          button.disabled = true;
        }

        button.addEventListener('click', () => {
          this.game.audioManager.playUiClick();

          if (this.game.shopSystem.purchase(skin.id)) {
            this.game.shopSystem.equip(skin.id);
          }
        });
      }

      card.appendChild(preview);
      card.appendChild(title);
      card.appendChild(price);
      card.appendChild(button);

      this.grid.appendChild(card);
    });
  }
}