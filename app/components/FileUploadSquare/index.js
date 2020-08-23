import './square.css';
import { FormattedMessage } from 'react-intl';
import H1 from 'components/H1';
import EjectLink from './EjectLink';
import React from 'react';
import Input from './Input.js';

function FileUploadSquare(props) {
    return (
        <div className={props.isBgGreen ? 'outer green' : 'outer red'}>
            <div className="inner">
                <H1>
                    <FormattedMessage {...props.message} /> 
                </H1>
                <Input type="file" ref={props.inputRef} onChange={props.fileHandler}/>
                <br></br>
                <EjectLink onClick={props.ejectHandler}>EJECT KEY</EjectLink>
            </div>
        </div>
    );
}

export default FileUploadSquare;