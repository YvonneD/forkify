// import string from './models/Search'
// // import { add as a, multiply as m, ID } from './views/searchView'
// import * as searchView from './views/searchView'
// // console.log(`using import ${a(ID,2)} and ${m(2,6)},${string}`)
// console.log(`using import ${searchView.add(searchView.ID,2)} and ${searchView.multiply(2,6)},${string}`)

import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";

/*global state search object.current recipe object. shoppinglist object. liked recipes */
const state = {};

/*search controller */
const controlSearch = async () => {
  //get query from view
  const query = searchView.getInput();

  if (query) {
    //new search object and add to state
    state.search = new Search(query);
    //prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      //search for recipes
      await state.search.getResults();
      //render resuslts on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("something wrong with search");
      clearLoader();
    }
  }
};

elements.searchForm.addEventListener("submit", e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    console.log(btn);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/*recipe controller */
const controlRecipe = async () => {
  //get Id from url
  const id = window.location.hash.replace("#", "");
  console.log(id);
  if (id) {
    //prepare UI for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //hightlight selected
    if (state.search) {
      searchView.highlightSelected(id);
    }

    //create new recipe object
    state.recipe = new Recipe(id);
    try {
      //get recipe data
      await state.recipe.getRecipe();

      state.recipe.parseIngredients();

      //calculate serving and time
      state.recipe.calcTime();
      state.recipe.calcServings();
      //render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert("error  processing");
    }
  }
};

// window.addEventListener("hashchange", controlRecipe);
// window.addEventListener('load',controlRecipe)
["hashchange", "load"].forEach(event =>
  window.addEventListener(event, controlRecipe)
);

//list controller
const controlList = () => {
  //create a new list if there in none yet
  if (!state.list) state.list = new List();

  //add each ingredient to the list
  state.recipe.ingredients.forEach(el => {
    state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//handle delete and update list item events
elements.shopping.addEventListener("click", e => {
  const id = e.target.closet(".shopping__item").dataset.itemid;
  //handle the delete button
  if (e.target.matches(".shopping__delete,..shopping__delete *")) {
    //delete from state
    state.list.deleteItem(id);
    //delete from UI
    listView.deleteItem(id);
    //handle the count update
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

//like controller
const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  //user has not liked current id
  if (!state.likes.isLiked(currentID)) {
    //add like to state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //toggle the like button
    likesView.toggleLikeBtn(true);
    //add like to UIlist
    likesView.renderLike(newLike);
    //user has liked current id
  } else {
    //remove like to state
    state.likes.deleteLike(currentID);
    //toggle the like button
    likesView.toggleLikeBtn(false);
    //remove like to UIlist
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//restore liked recipes on page load
window.addEventListener("load", () => {
  state.likes = new Likes();
  //restore likes
  state.likes.readStorage();
  //toggle like menu button
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  //render the exsiting likes
  state.likes.likes.forEach(like => likes.likesView.renderLike(like));
});

//handling recipe button clikes
elements.recipe.addEventListener("click", e => {
  if (e.target.matches(".btn-decrease,.btn-decrease *")) {
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase,.btn-increase *")) {
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add,.recipe__btn--add *")) {
    //add ingreditents to shoping list
    controlList();
  } else if (e.target.matches(".recipe__love,.recipe__love *")) {
    //like controller
    controlLike();
  }
});
