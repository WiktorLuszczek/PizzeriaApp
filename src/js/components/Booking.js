import { templates, select, settings, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;

    thisBooking.selectedTable;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);
    const params = {
      bookings: [
        startDateParam,
        endDateParam,

      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,

      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
      
    };
    //console.log(params);
    const urls = {
      bookings: settings.db.url      + '/' + settings.db.booking
                                     + '?' + params.bookings.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url  + '/' + settings.db.event
                                     + '?' + params.eventsRepeat.join('&'),
    };
    //console.log(urls);
    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings,eventsCurrent,eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat ){
    const thisBooking = this;
    
    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }
  makeBooked(date,hour,duration,table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);
    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      
      //console.log('loop', hourBlock);
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
    
    

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }
    for (let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if(
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      }else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    //console.log(thisBooking.dom.wrapper);
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.datePicker = element.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = element.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);

    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = element.querySelector(select.booking.floorPlan);
    thisBooking.dom.bookTable = element.querySelector(select.booking.bookTable);
    //thisBooking.dom.phone = element.querySelector(select.booking.phone);
    //thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.dom.starters = element.querySelectorAll('.booking-form [name="starter"]');
  }
  initTables(event){
    const thisBooking = this;
    if(event.target.classList.contains('table')){
      if(!event.target.classList.contains(classNames.booking.tableBooked)){
        const activeTable = document.querySelector('.active-table');
        if(activeTable !== null && activeTable !== event.target){
          thisBooking.removeTableSelection();
        }
        event.target.classList.toggle('active-table');
      }
    }
  }

  removeTableSelection(){
    const thisBooking = this;
    for(let table of thisBooking.dom.tables){
      table.classList.remove('active-table');
    }
  }
  sendBooking(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    let tableId = null;
    for(let table of thisBooking.dom.tables){
      if(table.classList.contains('active-table')){
        tableId = table.getAttribute('data-table');
      }
    }
    let payload = {};
    //console.log(payload);
    payload.data = document.querySelector('.flatpickr-input').value;
    console.log();
    payload.hour = thisBooking.hourPicker.value;
    payload.table = tableId;
    payload.duration = thisBooking.dom.wrapper.querySelector('.hours-amount .amount').value;
    payload.ppl = thisBooking.dom.wrapper.querySelector('.people-amount .amount').value;
    payload.starters= [];
    payload.phone = thisBooking.dom.wrapper.querySelector('input[type="tel"]').value;
    payload.address = thisBooking.dom.wrapper.querySelector('input[name="address"]'.value);
    //console.log(payload);
    for(let starter of thisBooking.dom.starters){
      if(starter.checked){
        payload.starters.push(starter.value);
      }
    }

    thisBooking.send(url, payload);
    thisBooking.makeBooked(payload.data, payload.hour, payload.duration, payload.table);
  }
  send(url, payload){
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(payload),
    };
    fetch(url, options);
    //console.log(url, options);
  }
  initWidgets(){
    const thisBooking = this;


    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function(){
      thisBooking.removeTableSelection();
    });
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function(){
      thisBooking.removeTableSelection();    
    });
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.dom.datePicker.addEventListener('updated', function(){
      thisBooking.removeTableSelection();    
    });
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.hourPicker.addEventListener('updated', function(){
      thisBooking.removeTableSelection();    
    });
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
    thisBooking.dom.floorPlan.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.initTables(event);
    });
    thisBooking.dom.bookTable.addEventListener('click', function(event){
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
}

export default Booking;