import { templates } from '../settings.js';

class Home{
  constructor(homeElem) {
    const thisHome = this;

    thisHome.render(homeElem);
  }
  render(element){
    const thisHome = this;
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    const generatedHTML = templates.homePage();
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    //console.log(generatedHTML);
  }
}

export default Home;