/*
  Copyright 2018, 2019 David Healey

  This file is part of Waistline.

  Waistline is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Waistline is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Waistline.  If not, see <http://www.gnu.org/licenses/>.
*/

var foodlist = {

  initialize: function() {

    this.page = document.querySelector('ons-page#foodlist');
    this.list = [];
    this.listCopy = []; //A backup copy of the list is always maintained for filtering

    //Setup lazy list
    this.infiniteList = document.querySelector('#foodlist #infinite-list');
  },

  setFilter : function(term)
  {
    var list = this.listCopy; //Search is performed on copy of list

    if (term) {
      var exp = new RegExp(term, "i");

      //Filter by name and brand
      list = list.filter(function (el) {
        if (el.name || el.brand) return el.name.match(exp) || el.brand.match(exp);
      });
    }
    this.list = list; //Replace master copy with filtered list
    this.infiniteList.refresh();
  },

  getFromDB: function()
  {
    return new Promise(function(resolve, reject){

      let list = [];

      if (window.localStorage.getItem("sort-foods") == "true")
        dbHandler.getIndex("name", "foodList").openCursor(null).onsuccess = processResult; //Sort foods alphabetically
      else
        dbHandler.getIndex("dateTime", "foodList").openCursor(null, "prev").onsuccess = processResult; //Sort foods by date

      function processResult(e)
      {
        var cursor = e.target.result;

        if (cursor)
        {
          list.push(cursor.value);
          cursor.continue();
        }
        else
        {
          resolve(list);
        }
      }
    });
  },

  renderListItem: function(index)
  {
    let item = this.list[index];

    let li = document.createElement("ons-list-item");
    li.id = "food-item" + index;

    //Name and info
    let center = document.createElement("div");
    center.className = "center";
    li.appendChild(center);

    let name = document.createElement("ons-row");
    name.innerText = item.name;
    center.appendChild(name);

    let calories = 0;
    if (item.nutrition != undefined) calories = item.nutrition.calories;

    let info = document.createElement("ons-row");
    info.innerText = item.brand + ", " + item.portion + ", " + calories + "kcal";
    center.appendChild(info);

    //Checkbox
    let right = document.createElement("div");
    right.className = "right";
    li.appendChild(right);

    let checkbox = document.createElement("ons-checkbox");
    checkbox.addEventListener('change', this.checkboxChange); //Attach event
    checkbox.name = "food-item-checkbox";
    right.appendChild(checkbox);

    return li;
  },

  //Checkbox change event callback function
  checkboxChange: function(){

    let btnScan = foodlist.page.querySelector('#scan'); //Barcode button
    let btnCheck = foodlist.page.querySelector('#submit'); //Barcode button
    let checkedboxes = foodlist.page.querySelectorAll('input[type=checkbox]:checked'); //All checked boxes

    if (checkedboxes.length == 0) {
      btnScan.style.display = "initial";
      btnCheck.style.display = "none";
    }
    else {
      btnScan.style.display = "none";
      btnCheck.style.display = "block";
    }
  },
};

//Page initialization
document.addEventListener("init", function(event){
  if (event.target.matches('ons-page#foodlist')) {

    //Call constructor
    foodlist.initialize();

    //Populate initial list from DB
    foodlist.getFromDB()
    .then(function(list){
      foodlist.list = list;
      foodlist.listCopy = list;

      //Setup lazy list delegate callbacks
      foodlist.infiniteList.delegate = {
        createItemContent: function(index, template) {
          return foodlist.renderListItem(index);
        },

        countItems: function() {
          return foodlist.list.length;
        },

        /*calculateItemHeight: function(index) {
          // Optional: return the height of the item at position `index`.
          // This can enhance calculations and allow better scrolling.
        },*/

        destroyItem: function(index, e) {
          //Remove checkbox event listener
          let checkbox = e.element.querySelector("ons-checkbox");
          checkbox.removeEventListener('change', foodlist.checkboxChange);
        }
      };
    });

    //Search/filter form
    const filter = document.querySelector('ons-page#foodlist #filter');
    filter.addEventListener("input", function(event){
      let value = event.target.value;
      foodlist.setFilter(value);
    });
 }
});
