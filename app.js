const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "f44xlom9n4z1",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "yau1Pdu_4U6XPpSMEEJlST-xGpuOgypvBfRo1W6gxuE",
});

// DOM variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
let cartAmountButton = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
let cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
const shopNowBtn = document.querySelector(".banner-btn");

//variables
let buttons = [];
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  let products = new Products();
  let ui = new UI();

  activateListeners(ui);

  ui.clearCart();
  ui.cartAction();

  products
    .getProducts()
    .then((products) => Storage.saveProducts(products))
    .then((products) => ui.displayProducts(products))
    .then(() => ui.setupApp())
    .then(() => ui.activateButtons());
});

function activateListeners(ui) {
  shopNowBtn.addEventListener("click", () => window.scrollTo(0, 600));
  cartBtn.addEventListener("click", () => {
    ui.showCart();
  });
  closeCartBtn.addEventListener("click", () => {
    ui.closeCart();
  });
}

class Products {
  async getProducts() {
    try {
      let data = await client.getEntries();
      let products = data.items;

      products = products.map((item) => {
        let id = item.sys.id;
        let { title, price } = item.fields;
        let image = item.fields.image.fields.file.url;
        image = "https:" + image;
        let amount = 1;
        return { id, title, price, image, amount };
      });
      return products;
    } catch (error) {
      console.error;
    }
  }
}
class UI {
  displayProducts(products) {
    let result = "";
    products.forEach((item) => {
      console.log(item.image)
      result += `<article class="product">
                <div class="img-container">
                    <img src=${item.image} alt="product" class="product-img">
                    <button class="bag-btn" data-id=${item.id}>
                        <i class="fas fa-shopping-cart"></i>
                        add to bag
                    </button>
                </div>
                    <h3>${item.title}</h3>
                    <h4>$ ${item.price}</h4>
            </article>`;
    });
    productsDOM.innerHTML = result;
    buttons = [...document.getElementsByClassName("bag-btn")];
    return products;
  }
  activateButtons() {
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        let id = button.dataset.id;
        let item = Storage.getProduct(id);
        cart = [...cart, item];
        this.disableButtons(cart);
        Storage.saveCart(cart);
        this.updateCartDom(cart);
        this.setCartValues(cart);
        this.showCart();
      });
    });
  }
  disableButtons(cart) {
    cart.forEach((item) => {
      let button = buttons.find((button) => button.dataset.id === item.id);
      button.disabled = true;
      button.innerHTML = "In Cart";
    });
  }
  updateCartDom(cart) {
    while (cartContent.firstChild) {
      cartContent.removeChild(cartContent.lastChild);
    }
    cart.forEach((item) => {
      let divItem = document.createElement("div");
      divItem.classList.add("cart-item");
      if (!item.image.startsWith("https:")) {
        item.image = "https:" + item.image;
      }
      divItem.innerHTML = `<img src=${item.image} alt="">
                        <div>
                            <h4>${item.title}</h4>
                            <h5>$ ${item.price}</h5>
                            <span class="remove-item" data-id=${item.id}>remove</span>
                        </div>
                        <div>
                            <i class="fas fa-chevron-up" data-id=${item.id}></i>
                            <p class="item-amount">${item.amount}</p>
                            <i class="fas fa-chevron-down" data-id=${item.id}></i>
                        </div>`;
      cartContent.appendChild(divItem);
    });
  }
  setupApp() {
    if (localStorage.getItem("cart2") !== null) {
      let items = JSON.parse(localStorage.getItem("cart2"));
      items.forEach((item) => {
        cart = [...cart, item];
      });
      this.updateCartDom(cart);
      this.disableButtons(cart);
      this.setCartValues(cart);
    }
  }
  setCartValues(cart) {
    let amount = 0;
    let total = 0;
    cart.forEach((item) => {
      amount += item.amount;
      total += item.amount * item.price;
    });
    cartAmountButton.innerText = amount;
    cartTotal.innerText = total.toFixed(2);
  }
  clearCart() {
    clearCartBtn.addEventListener("click", () => {
      cart.forEach((item) => {
        let button = buttons.find((button) => button.dataset.id === item.id);
        let id = button.dataset.id;
        this.updateButton(id);
      });

      while (cart.length > 0) {
        cart.pop();
      }
      Storage.saveCart(cart);
      this.setCartValues(cart);
      this.updateCartDom(cart);
    });
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  closeCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }
  cartAction() {
    cartContent.addEventListener("click", () => {
      let id = event.target.dataset.id;
      if (event.target.classList.contains("remove-item")) {
        this.purgeItem(id);
        this.setCartValues(cart);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let arrowUp = event.target;
        let item = cart.find((item) => item.id === id);
        item.amount += 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        arrowUp.nextElementSibling.innerText = item.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let arrowDown = event.target;
        let item = cart.find((item) => item.id === id);
        item.amount -= 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        arrowDown.previousElementSibling.innerText = item.amount;
        
        if (item.amount === 0) {
        this.purgeItem(id);
        }
      }
  });
  }
  purgeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    Storage.saveCart(cart);
    this.updateCartDom(cart);
    this.updateButton(id);
  }
  updateButton(id) {
    let button = buttons.find((button) => button.dataset.id === id);
    button.innerText = "Add to Bag";
    button.disabled = false;
    }
}
class Storage {
  static saveProducts(products) {
    products = JSON.stringify(products);
    localStorage.setItem("products2", products);
    products = JSON.parse(products);
    return products;
  }
  static saveCart(cart) {
    localStorage.setItem("cart2", JSON.stringify(cart));
  }
  static getProduct(id) {
    //after parsing the products variable will be an array
    let products = JSON.parse(localStorage.getItem("products2"));
    return products.find((product) => product.id === id);
  }
}

