import {settings, select, classNames, templates} from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';
class Cart {
  constructor(element){
    const thisCart = this;
    thisCart.products = [];
    thisCart.getElements(element);
    thisCart.initActions();
    //console.log('newCart', thisCart);
  }
  getElements(element){
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger= thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList= thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
  }
  initActions(){
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click',function(){
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(){
      thisCart.update();
    });
    thisCart.dom.productList.addEventListener('remove',function(event){
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit',function(event){
      event.preventDefault();
      thisCart.sendOrder();
    });
  }
  add(menuProduct){
    const thisCart = this;
    /* generate HTML based on template */
    const generatedHTML = templates.cartProduct(menuProduct);
    /* create DOM element */
    const generatedDom = utils.createDOMFromHTML(generatedHTML);
    /* add element to thisCart.dom.productList*/
    thisCart.dom.productList.appendChild(generatedDom);
    thisCart.products.push(new CartProduct(menuProduct, generatedDom));
    thisCart.update();
  }
  update(){
    const thisCart = this;
    thisCart.deliveryFee = 0;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for(const product of thisCart.products){
      thisCart.totalNumber = thisCart.totalNumber + product.amount;
      thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
    }

    if(thisCart.totalNumber !== 0){
      thisCart.deliveryFee =settings.cart.defaultDeliveryFee;
    }

    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.deliveryFee.innerHTML = thisCart.deliveryFee;
    for (const totalPrice of thisCart.dom.totalPrice) {
      totalPrice.innerHTML = thisCart.totalPrice;
    }
  }
  remove(removedProduct){
    const thisCart = this;
    const indexOfRemovedProduct = thisCart.products.indexOf(removedProduct);
    removedProduct.dom.wrapper.remove();
    thisCart.products.splice(indexOfRemovedProduct, 1);
    thisCart.update();

  }

  sendOrder(){
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;
    let payload = {};
    //console.log(payload);
    payload.address = thisCart.dom.address.value;
    payload.phone = thisCart.dom.phone.value;
    payload.totalPrice = thisCart.totalPrice;
    payload.subtotalPrice = thisCart.subtotalPrice;
    payload.totalNumber = thisCart.totalNumber;
    payload.deliveryFee = thisCart.deliveryFee;
    payload.products = [];
    for(let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);
    //console.log(url);

  }
}
export default Cart;