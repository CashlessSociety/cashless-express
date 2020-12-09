/**
 *
 * App
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { Switch, Route } from 'react-router-dom';

import AdminPage from 'containers/AdminPage/Loadable';
import NotFoundPage from 'containers/NotFoundPage/Loadable';
import HomePage from 'containers/HomePage/Loadable';
import ProfilePage from 'containers/ProfilePage/Loadable';
import WalletPage from 'containers/WalletPage/Loadable';
import TxDetailsPage from 'containers/TxDetailsPage/Loadable';
import PortfolioPage from 'containers/PortfolioPage/Loadable';
import AuthJoinPage from 'containers/AuthJoinPage/Loadable';
import ExplorePage from 'containers/ExplorePage/Loadable';
import Header from 'components/Header';
//import Footer from 'components/Footer'; 
import './app.css';


export default function App() {
  return (
    <div className="container">
        <div className="top_lvl">
        <Helmet
            titleTemplate="%s - cashless.social"
            defaultTitle="cashless.social">
            <meta name="description" content="cashless webapp" />
        </Helmet>
        <Header />
        <Switch>
            <Route exact path="/" component={HomePage} />
            <Route exact path="/profile" component={ProfilePage} />
            <Route exact path="/wallet" component={WalletPage} />
            <Route exact path="/explore" component={ExplorePage} />
            <Route path="/promise/:feedId/:claimName" component={TxDetailsPage} />
            <Route path="/feed/:id" component={PortfolioPage} />
            <Route path="/join/auth/:email" component={AuthJoinPage}/>
            <Route path="" component={NotFoundPage} />
        </Switch>  
        </div>
    </div>
  );
}
