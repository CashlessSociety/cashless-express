/*
 * Admin Page
 *
 * 
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import H1 from 'components/H1';
import FileUploadSquare from 'components/FileUploadSquare';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { useInterval } from './interval';
import './admin.css';

const now = () => {
  return Math.floor(Date.now() / 1000);
};

export default function AdminPage() {
  const [isBg1Green, setBg1Green] = useState(false);
  const [resetBg1Time, setResetBg1Time] = useState(0);
  const [isBg2Green, setBg2Green] = useState(false);
  const [resetBg2Time, setResetBg2Time] = useState(0);
  const [isBg3Green, setBg3Green] = useState(false);
  const [resetBg3Time, setResetBg3Time] = useState(0);
  const [isBg4Green, setBg4Green] = useState(false);
  const [resetBg4Time, setResetBg4Time] = useState(0);
  const ref1 = React.useRef();
  const ref2 = React.useRef();
  const ref3 = React.useRef();
  const ref4 = React.useRef();
  const [isKeyActive, setKeyActive] = useState(false);

  const createFileHandler = (i, setBgGreen, setResetBgTime) => {
    return evt => {
      if (evt.target.files.length > 0) {
        onChangeFileHandler(
          evt.target.files[0],
          (i + 1).toString(),
          setBgGreen,
          setResetBgTime,
        );
      } else {
        console.log('no file found');
      }
    };
  };
  const createEjectHandler = (i, setResetBgTime, inputRef) => {
    return () => {
      onEjectFileHandler((i + 1).toString(), setResetBgTime, inputRef);
    };
  };

  const onChangeFileHandler = (file, name, setBgGreen, setResetBgTime) => {
    const data = new FormData();
    data.append('file', file);
    data.append('filename', name + '.json');
    axios.post('http://127.0.0.1:3000/upload', data, {}).then(res => {
      console.log('upload:', res.statusText);
      setBgGreen(true);
      setResetBgTime(now() + 3);
    });
  };

  const onEjectFileHandler = (name, setResetBgTime, inputRef) => {
    const data = new FormData();
    data.append('filename', name + '.json');
    axios.post('http://127.0.0.1:3000/remove', data, {}).then(res => {
      console.log('remove:', res.statusText);
      setResetBgTime(now() + 3);
      inputRef.current.value = "";
    });
  };

  let msgs = [messages.adminName1, messages.adminName2, messages.adminName3, messages.adminName4,];
  let bgs = [isBg1Green, isBg2Green, isBg3Green, isBg4Green];
  let setBgs = [setBg1Green, setBg2Green, setBg3Green, setBg4Green];
  let resetBgs = [resetBg1Time, resetBg2Time, resetBg3Time, resetBg4Time];
  let setResetBgs = [setResetBg1Time, setResetBg2Time, setResetBg3Time, setResetBg4Time];
  let refs = [ref1, ref2, ref3, ref4];
  let admins = [];
  for (let i = 0; i < msgs.length; i++) {
    admins.push({
      message: msgs[i],
      isBgGreen: bgs[i],
      setBgGreen: setBgs[i],
      resetBgTime: resetBgs[i],
      setResetBgTime: setResetBgs[i],
      fileHandler: createFileHandler(i, setBgs[i], setResetBgs[i]),
      ejectHandler: createEjectHandler(i, setResetBgs[i], refs[i]),
      inputRef: refs[i],
    });
  }

  useInterval(async () => {
    let res = await axios.post('http://127.0.0.1:3000/pollKeyfiles', {}, {});
    for (let i = 0; i < admins.length; i++) {
      if (now() > admins[i].resetBgTime) {
        if (res.data[(i + 1).toString()]) {
          admins[i].setBgGreen(true);
        } else {
          admins[i].setBgGreen(false);
        }
      }
    }
    if (res.data.address == '0x16CB040676886eF950888Ae2BC7464Ea0b44855b') {
      setKeyActive(true);
    } else {
      setKeyActive(false);
    }
  }, 2000);

  return (
    <article>
      <Helmet>
        <title>Admin Page</title>
        <meta name="description" content="My admin page" />
      </Helmet>
      <H1 className='adminTitle'>
        <FormattedMessage {...messages.uploadHeader} />
      </H1>
      <div>
      {admins.map(({ isBgGreen, message, ejectHandler, fileHandler, inputRef }) => {
          return <FileUploadSquare
            isBgGreen={isBgGreen}
            message={message}
            ejectHandler={ejectHandler}
            fileHandler={fileHandler}
            inputRef={inputRef}
          />;
        })}
      </div>
      <div className='bottomCard'>
        <H1 className={isKeyActive ? 'greenText':'blackText'}>{isKeyActive ? 'Active' : 'Inactive'}</H1>
      </div>
    </article>
  );
}
