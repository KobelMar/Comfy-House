const client = contentful.createClient({
  //In each 'Space' you can create 'API keys'. this here is for the Space 'Comfy Store' and the name of the Api is "furniture api"
  //...It consists of two value. the first is the 'Space ID'.
    space: "f44xlom9n4z1",
  // This is the second value: "Access Token"
  accessToken: "yau1Pdu_4U6XPpSMEEJlST-xGpuOgypvBfRo1W6gxuE",
});

// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
let cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");
const shopNowBtn = document.querySelector(".banner-btn");

// cart
let cart = [];
//buttons
let buttonsDOM = [];

document.addEventListener("DOMContentLoaded", () => {
  shopNowBtn.addEventListener("click", () => window.scrollTo(0, 700));

  const ui = new UI();
  const products = new Products();

  ui.setupApp();
  products
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      //info: saveProducts() can be called without initiating an instance of the class because the method is 'static'.
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});

class Products {
  // async Function always return a Promise.
  async getProducts() {
    try {
      let contentful = await client.getEntries();
      let products = contentful.items;

      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

class UI {
  displayProducts(products) {
    let result = "";
    products.forEach((product) => {
      result += `<article class="product">
                <div class="img-container">
                    <img src=${product.image} alt="product" class="product-img">
                    <button class="bag-btn" data-id=${product.id}>
                        <i class="fas fa-shopping-cart"></i>
                        add to bag
                    </button>
                </div>
                    <h3>${product.title}</h3>
                    <h4>${product.price} $</h4>
            </article>`;
    });
    productsDOM.innerHTML = result;
    return products;
  }
  getBagButtons() {
    let buttons = document.querySelectorAll(".bag-btn");
    buttons = Array.from(buttons);
    buttonsDOM = buttons;

    buttons.forEach((button) => {
      let id = button.getAttribute("data-id");
      let inCart = cart.find((item) => item.id === id);
      if (inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (event) => {
        event.target.innerText = "In Cart";
        event.target.disabled = true;
        // get clicked-product from localstorage-products
        let clickedItem = { ...Storage.getProduct(id), amount: 1 };
        // add product to the cart
        //info: the spreadoperator creates an array from multiple arrays in this case.
        cart = [...cart, clickedItem];
        // save cart in localStorage
        Storage.saveCart(cart);
        // set cart values (cart-button-amount + total$ amount in cart)
        this.setCartValues(cart);
        // add item to cart
        this.addCartItem(clickedItem);
        // show cart/overlay
        this.showCart();
      });
    });
  }
  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.forEach((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }
  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `<img src=${item.image} alt="">
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
    cartContent.appendChild(div);
  }
  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }
  setupApp() {
    // when refreshing the page, check if localstorage has 'cart-items'
    //...and if so, then load them to cart-array.
    cart = Storage.getCart();
    // set Cart-Button-Amount and $-Amount in Cart accorindgly.
    this.setCartValues(cart);
    // Add existing items to cart.
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }
  populateCart(cart) {
    cart.forEach((item) => this.addCartItem(item));
  }
  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }
  cartLogic() {
    //clear cart button
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    //cart functionality
    cartContent.addEventListener("click", (event) => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        //removing item from 'cart' + setCartValues + updating Localstorage.
        this.removeItem(id);
        //remove item from CartDom.
        cartContent.removeChild(removeItem.parentNode.parentNode);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        // info: If I asign an array.element to a new variable and then change the value of this variable,
        //...the array.elemen is automaticly updated with the new value as the new variable is just referencing the array.element.
        tempItem.amount += 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let minusAmount = event.target;
        let id = minusAmount.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        // info: If I asign an array.element to a new variable and then change the value of this variable,
        //...the array.elemen is automaticly updated with the new value as the new variable is just referencing the array.element.
        tempItem.amount -= 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        minusAmount.previousElementSibling.innerText = tempItem.amount;

        if (tempItem.amount === 0) {
          this.removeItem(id);
          cartContent.removeChild(minusAmount.parentNode.parentNode);
        }
      }
    });
  }
  clearCart() {
    let cartIds = cart.map((item) => item.id);
    cartIds.forEach((cartId) => this.removeItem(cartId));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to bag`;
  }
  getSingleButton(cartId) {
    return buttonsDOM.find((button) => button.dataset.id === cartId);
  }
}

class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    //after parsing the products variable will be an array
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}
