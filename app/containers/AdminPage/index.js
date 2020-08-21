/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 */

import React, {useState} from 'react';
import { FormattedMessage } from 'react-intl';
import { Helmet } from 'react-helmet';
import H1 from 'components/H1';
import EjectLink from './EjectLink';
import messages from './messages';
import './square.css';
import Input from './Input';
import {useInterval} from './interval';
import axios from 'axios';

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
            }
            if (res.data['2']) {
                setBg2(true);
            }
            if (res.data['3']) {
                setBg3(true);
            }
            if (res.data['4']) {
                setBg4(true);
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
        <div className={isBg1Green ? 'square green' : 'square red'}>
            <div className="content">
                <div className="table">
                    <div className="table-cell">
                        <H1>
                            <FormattedMessage {...messages.adminName1} /> 
                        </H1>
                        <Input type="file" id="file1" onChange={handleFile1}/>
                        <EjectLink onClick={handleEject1}>EJECT KEY</EjectLink>
                    </div>
                </div>
            </div>
        </div>
        <div className={isBg2Green ? 'square green' : 'square red'}>
            <div className="content">
                <div className="table">
                    <div className="table-cell">               
                        <H1>
                            <FormattedMessage {...messages.adminName2} /> 
                        </H1>
                        <Input type="file" id="file2" onChange={handleFile2}/>
                        <EjectLink onClick={handleEject2}>EJECT KEY</EjectLink>
                    </div>
                </div>
            </div>
        </div>

        <div className={isBg3Green ? 'square green' : 'square red'}>
        <div className="content">
                <div className="table">
                    <div className="table-cell">
                        <H1>
                            <FormattedMessage {...messages.adminName3} /> 
                        </H1>
                        <Input type="file" id="file3" onChange={handleFile3}/>
                        <EjectLink onClick={handleEject3}>EJECT KEY</EjectLink>
                    </div>
                </div>
            </div>
        </div>
        <div className={isBg4Green ? 'square green' : 'square red'}>
        <div className="content">
                <div className="table">
                    <div className="table-cell">
                        <H1>
                            <FormattedMessage {...messages.adminName4} /> 
                        </H1>
                        <Input type="file" id="file4" onChange={handleFile4}/>
                        <EjectLink onClick={handleEject4}>EJECT KEY</EjectLink>
                    </div>
                </div>
            </div>
        </div>

      </article>
    );
}
