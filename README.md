# @ridi/react-viewer

[![Build Status](https://travis-ci.com/ridi/react-viewer.svg?branch=master)](https://travis-ci.com/ridi/react-viewer)
[![npm version](https://img.shields.io/npm/v/@ridi/react-viewer.svg)](https://www.npmjs.com/package/@ridi/react-viewer)

## Demo
https://ridi.github.io/react-viewer/demo/

## Installation
```
npm install @ridi/react-viewer
```

## How to Use

### Initialize

Add `@ridi/react-viewer` reducer into your reducers.
```js
import { reducers as reader } from '@ridi/react-viewer';
import { combineReducers } from 'redux';

const appReducer = combineReducers({
    ...
    reader,
    ...
});
```

Connect `Connector` with redux store.
```js
import { createStore } from 'redux';
import { Connector } from '@ridi/react-viewer';

const store = createStore( ... );
Connector.connect(store);
```

### Quick start

`Service` must be loaded for initializing Reader's lifecycle.

And put `Reader` component into your component.

```js
import React from 'react';
import Reader, { Service } from '@ridi/react-viewer';

Service.loadAll();
export default ViewerPage extends React.Component {
    render() {
        return <Reader />;
    }
};
```

#### `Service`

- `loadAll`
  - params:
    - `restoreState`(`Object`): state object for restoring redux store
    - `config`(`Object`)
      - `beforeContentCalculated`: Check out [Hooks](#hooks) section for more details

#### `<Reader>` Component

`Reader` component provides all functionality of viewer and renders viewer body.

Here are `Reader`'s properties:

* `footer`(node): markup for the footer area
* `contentFooter`(node): markup for the content footer area
* `selectable`(boolean): set reader to be selectable
* `annotationable`(boolean): set reader to be annotationable
* `annotations`(array): annotation list is composed of items that has distinct `id` property. 



### Events

Below events can be used with `EventBus` 

```js
import { EventBus, Events, TouchEvent } from '@ridi/react-viewer';

EventBus.on(Events.TOUCH, (event) => {
  const { clientX, clientY, annotation } = event.detail;
  if (event.type === TouchEvent.TouchAnnotation) {
    console.log(annotation);
  } else {
    console.log(clientX, clientY);
  }
});

EventBus.emit(Events.SET_CONTENTS_BY_URI, { ... });
```

* `Events.SET_CONTENTS_BY_URI` (emmitable): Check out [Render Contents](#render-contents) section for more details
  - params:
    - `data`(`Object`)
      - `contentFormat`(`ContentFormat`)
      - `bindingType`(`BindingType`)
      - `uris`(`Array`): Array of uri to fetch content
* `Events.SET_CONTENTS_BY_VALUE` (emmitable): Check out [Render Contents](#render-contents) section for more details
  - params:
    - `data`(`Object`)
      - `contentFormat`(`ContentFormat`)
      - `bindingType`(`BindingType`)
      - `contents`(`Array`): Array of HTML document(`contentFormat` === `ContentFormat.HTML`) or base64 encoded image source(`contentFormat` === `ContentFormat.IMAGE`)
* `Events.SCROLL`(listenable): Screen is scrolled
  - params:
    - `event`(`ScrollEvent`)
* `Events.TOUCH`(listenable): Screen is touched (or annotation is touched)
  - params:
    - `event`(`TouchEvent`)
      - `type`(`TouchEvent`): `TouchEvent.Touch` or `TouchEvent.AnnotationTouch`
      - `detail`
        - `screenX`
        - `screenY`
        - `clientX`
        - `clientY`
        - `pageX`
        - `pageY`
        - `type`: original event type
        - `target`: original event target
        - `annotation`: annotation info
* `Events.CHANGE_SELECTION`(listenable): Current selection is changed
  - params:
    - `event`(`Object`)
      - `selection`: selection info
      - `selectionMode`(`SelectionMode`)
* `Events.MOUNTED`(listenable): `<Reader>` has been mounted
* `Events.UNMOUNTED`(listenable): `<Reader>` has been unmounted

### Hooks

You would use *hooks* when you want to intercept some point of reader's lifecycle.
Hook implementations can return value in any forms compatible with [RxJS's ObservableInput](https://rxjs-dev.firebaseapp.com/api/index/type-alias/ObservableInput). 

* `beforeContentCalculated`: executed just right before per content calculation is completed
  * params:
    * `contentIndex`(number): index number of current calculating content
    * `readerJsHelper`(`ReaderJsHelper`): `ReaderJsHelper` instance mounted on this current calculating content

* `afterContentCalculated`: executed just right after per content calculation is completed
  * params:
    * `calculations`(Array): current status of calculations

### Render Contents

#### `Events.SET_CONTENTS_BY_URI` or `Events.SET_CONTENTS_BY_VALUE`

Whole contents with metadata must set in a time.
Emit `Events.SET_CONTENTS_BY_(URI/VALUE)` event with URIs of contents or contents loaded already.

```js
import {
  ContentFormat,
  BindingType,
  EventBus,
  Events,
} from '@ridi/react-viewer';

EventBus.emit(Events.SET_CONTENTS_BY_URI, {
  contentFormat: ContentFormat.HTML,
  bindingType: BindingType.LEFT,
  uris: [
    './uri1.json',
    './uri2.json',
    ...,
  ],
});

EventBus.emit(Events.SET_CONTENTS_BY_VALUE, {
  contentFormat: ContentFormat.HTML,
  bindingType: BindingType.LEFT,
  contents: [
    '<p>...</p>',
    '<p>...</p>',
    ...,
  ],
});
```

* `contentFormat`: content format (HTML: 0, IMAGE: 1)
* `bindingType`: binding type (LEFT: 0, RIGHT: 1)

## How to Run Demo

```
$ npm install
$ npm run install:demo
$ npm run watch
```
Browse http://localhost:8000.
