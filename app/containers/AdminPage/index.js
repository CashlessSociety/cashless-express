/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, {useState} from 'react';
import { FormattedMessage } from 'react-intl';
import { Helmet } from 'react-helmet';
import H1 from 'components/H1';
import messages from './messages';
//import Form from './Form';
import Input from './Input';
import axios from 'axios';

export default function AdminPage() {

    const [adminName, setAdminName] = useState(null);

    const onChangeTextHandler = event => {
        setAdminName(event.target.value.toLowerCase());
    }

    const onChangeFileHandler= event => {
        const data = new FormData();
        if (adminName=="ari" || adminName=="linc" || adminName=="justin" || adminName=="miles") {
            data.append('file', event.target.files[0]);
            data.append('filename', adminName+".json");
            axios.post("http://localhost:3000/upload", data, {}).then(res => {
                console.log(res.statusText);
            });
        } else {
            console.log('invalid name');
        }
    }

    return (
        <article>
        <Helmet>
          <title>Admin Page</title>
          <meta
            name="description"
            content="My admin page"
          />
        </Helmet>
        <div>
            <H1>
                <FormattedMessage {...messages.uploadHeader} />
            </H1>
            <Input type="text" value={adminName||"abc"} onChange={onChangeTextHandler}/>
            <Input type="file" onChange={onChangeFileHandler}/>
        </div>
      </article>
    );
}
