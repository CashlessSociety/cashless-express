/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import { Switch, Route } from 'react-router-dom';

import AdminPage from 'containers/AdminPage/Loadable';
import NotFoundPage from 'containers/NotFoundPage/Loadable';
import HomePage from 'containers/HomePage/Loadable';
import Header from 'components/Header';
import Footer from 'components/Footer'; 
import './app.css';

const AppWrapper = styled.div`
  max-width: calc(768px + 16px * 2);
`;

export default function App() {
  return (
    <AppWrapper className="top_lvl">
      <Helmet
        titleTemplate="%s - React.js Boilerplate"
        defaultTitle="React.js Boilerplate"
      >
        <meta name="description" content="A React.js Boilerplate application" />
      </Helmet>
      <Header />
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route exact path="/admin" component={AdminPage} />
        <Route path="" component={NotFoundPage} />
      </Switch>
      <Footer />   
    </AppWrapper>
  );
}
