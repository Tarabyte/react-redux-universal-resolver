#  react-redux-universal-resolver ![Experimental](https://img.shields.io/badge/status-experimental-red.svg)
Yet another ~~isomorphic~~ universal [redux](https://www.npmjs.com/package/react-redux) based async resolver for React.

> This project is __NOT__ production ready and might never would be.


## Motivation
I was playing with different approaches to handle data fetching in redux base application both on server and client. There are solutions [available](#similar-projects).
But I've decided to write my own to get a better understanding of universal applications.

General idea is well describe in redux [docs](http://redux.js.org/docs/recipes/ServerRendering.html):

### On Server
- You somehow "extract" each piece of data required for container components to be rendered based current route. Usually by filtering components that expose static `fetchData` method.
- Prefetch each piece "in parallel" on server. Save collected data to store.
- Serialize state and save string in global variable say `window.__INITIAL_STATE__`.
- Render components, wrap with html (doctype etc), and send response to client.

### On Client
- Create store using `window.__INITIAL_STATE__` as initial data.
- Later
  - Either Use `componentDidMount` hook to check if data was loaded. If not run data fetching process.
  - Or listen to history change events and orchestrate data fetching process the same way it was done on server.

It all sounds like a lot of boilerplate code to write. And in fact it is. That's why there are almost a hundred of "boilerplate" [projects](http://andrewhfarmer.com/starter-project/) available. Each of which utilize some data fetching package.

### Basic Requirements
- Provide HOC that allows
  - Specify data requirements for component.
  - Provide custom mapping to fetching params based on current state and own component props on client.
  - Provide custom mapping to fetching params based on current state and router props on server.
  - Render another component when data is fetching (in-place loader indicators).
  - Render another component when data fetch failed (error message).
- Reduce serverside data prefetching to a single function call.
- Eliminate
  - Requirement for manual `componentDidMount` implementation.
  - Manual clientside fetching orchestration.
- Use redux store as the only source of state.
- Tests :lol:.


## Installation

Assuming you have node and npm installed (not publish yet)

``` npm install --save react-redux-universal-resolver ```

## Docs
- [API](docs/API.md)
 - [`resolver(mapParamsToPromises, [mapStateToParams], [mapRouteToParams], [options])`](docs/API.md#resolver)
 - [`resolveOnServer(components, state, routeProps, dispatch)`](docs/API.md#resolveOnServer)
- [Usage](docs/EXAMPLE.md)

## Similar Projects

- [ReduxAsyncConnect](https://github.com/Rezonans/redux-async-connect). Provides `@asyncConnect` decorator and `ReduxAsyncConnect` component to orchestrate data loading. Uses redux to manage state.
- [react-resolver](https://github.com/ericclemmons/react-resolver). Provides `@resolve` decorator. Not redux based.
- [redial](https://github.com/markdalgleish/redial). Provides `@provideHooks` decorator. Not redux based.


