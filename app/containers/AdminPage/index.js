/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, {useState} from 'react';
import { Helmet } from 'react-helmet';
import H1 from 'components/H1';
import FileUploadSquare from 'components/FileUploadSquare';
import messages from './messages';
import {useInterval} from './interval';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';

export default function AdminPage() {

    const [isBg1Green, setBg1] = useState(false);
    const [isBg2Green, setBg2] = useState(false);
    const [isBg3Green, setBg3] = useState(false);
    const [isBg4Green, setBg4] = useState(false);
    //const [isKeyActive, setKeyActive] = useState(false);

    const handleFile1 = evt => {
        if (evt.target.files.length>0) {
            onChangeFileHandler(evt.target.files[0], '1');
        } else {
            console.log('no file found');
        }
    }

    const handleFile2 = evt => {
        if (evt.target.files.length>0) {
            onChangeFileHandler(evt.target.files[0], '2');
        } else {
            console.log('no file found');
        }
    }

    const handleFile3 = evt => {
        if (evt.target.files.length>0) {
            onChangeFileHandler(evt.target.files[0], '3');
        } else {
            console.log('no file found');
        }
    }

    const handleFile4 = evt => {
        if (evt.target.files.length>0) {
            onChangeFileHandler(evt.target.files[0], '4');
        } else {
            console.log('no file found');
        }
    }

    const handleEject1 = () => {
        onEjectFileHandler('1');
    }

    const handleEject2 = () => {
        onEjectFileHandler('2');
    }

    const handleEject3 = () => {
        onEjectFileHandler('3');
    }

    const handleEject4 = () => {
        onEjectFileHandler('4');
    }

    const onChangeFileHandler = (file, name) => {
        const data = new FormData();
        data.append('file', file);
        data.append('filename', name+".json");
        axios.post("http://localhost:3000/upload", data, {}).then(res => {
            console.log(res);
        });
    }

    const onEjectFileHandler = (name) => {
        const data = new FormData();
        data.append('filename', name+".json");
        axios.post("http://localhost:3000/remove", data, {}).then(res => {
            console.log(res);
        });
    }
    
    useInterval(() => {
        axios.post("http://localhost:3000/pollKeyfiles", {}, {}).then(res => {
            console.log(res.data);
            if (res.data['1']) {
                setBg1(true);
            } else {
                setBg1(false);
            }
            if (res.data['2']) {
                setBg2(true);
            } else {
                setBg2(false);
            }
            if (res.data['3']) {
                setBg3(true);
            } else {
                setBg3(false);
            }
            if (res.data['4']) {
                setBg4(true);
            } else {
                setBg4(false);
            }
            if (res.data.address=="0x16CB040676886eF950888Ae2BC7464Ea0b44855b") {
                console.log('reconstructed correct address');
            }
        });
      }, 2000);
      

    return (
        <article>
        <Helmet>
          <title>Admin Page</title>
          <meta
            name="description"
            content="My admin page"
          />
        </Helmet>
        <H1>
            <FormattedMessage {...messages.uploadHeader} />
        </H1>
        <FileUploadSquare  isBgGreen={isBg1Green} message={messages.adminName1} ejectHandler={handleEject1} fileHandler={handleFile1} />
        <FileUploadSquare  isBgGreen={isBg2Green} message={messages.adminName2} ejectHandler={handleEject2} fileHandler={handleFile2} />
        <FileUploadSquare  isBgGreen={isBg3Green} message={messages.adminName3} ejectHandler={handleEject3} fileHandler={handleFile3} />
        <FileUploadSquare  isBgGreen={isBg4Green} message={messages.adminName4} ejectHandler={handleEject4} fileHandler={handleFile4} />
      </article>
    );
}
