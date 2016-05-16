import {div, button, textarea} from '@cycle/dom';
import xs from 'xstream';
import Collection from './collection';

const cardActions = {
  toggleEditing (state) {
    return {
      ...state,

      editing: !state.editing
    };
  },

  saveChanges (text) {
    return (state) => {
      return {
        ...state,

        text,

        editing: false
      };
    };
  }
};

function Card ({DOM}) {
  const remove$ = DOM
    .select('.remove')
    .events('click');

  const editing$ = DOM
    .select('.card')
    .events('dblclick')
    .mapTo(cardActions.toggleEditing);

  const clickSave$ = DOM
    .select('.save')
    .events('click');

  const textChange$ = DOM
    .select('.change-text')
    .events('change')
    .map(ev => ev.target.value);

  const saveChanges$ = textChange$
    .map(text => clickSave$.map(() => cardActions.saveChanges(text)))
    .flatten();

  const initialState = {
    text: 'Double click to edit',
    editing: false
  };

  const action$ = xs.merge(
    editing$,

    saveChanges$
  );

  const state$ = action$.fold((state, action) => action(state), initialState);

  return {
    DOM: state$.map(state => (
      div('.card', [
        state.editing ? textarea('.change-text', state.text) : state.text,
        button('.remove', 'x'),
        state.editing ? button('.save', 'Save') : ''
      ])
    )),

    remove$
  };
}

function Container (name, Component) {
  function view (state, childVtrees) {
    return (
      div('.' + name.toLowerCase(), [
        button('.add', `Add ${Component.name}`),

        div(`.${Component.name.toLowerCase()}s`, childVtrees)
      ])
    );
  }

  const actions = {
    addChild (state) {
      return {
        ...state,

        children: state.children.add({})
      };
    }
  };

  const childActions = {
    remove$ (state, removedChild) {
      return {
        ...state,

        children: state.children.remove(removedChild)
      };
    }
  };

  function container ({DOM}) {
    const children = Collection(Component, {DOM}, childActions);

    const initialState = {
      children
    };

    const addChild$ = DOM
      .select('.add')
      .events('click')
      .mapTo(actions.addChild);

    const action$ = xs.merge(
      children.action$,

      addChild$
    );

    const state$ = action$.fold((state, action) => action(state), initialState);

    const children$ = state$.map(state => state.children);

    const childVtrees$ = Collection.pluck(children$, 'DOM');

    return {
      DOM: xs.combine(view, state$, childVtrees$)
    };
  }

  Object.defineProperty(container, 'name', {value: name});

  return container;
}

const Main = Container('Main', Container('List', Card));

export default Main;
