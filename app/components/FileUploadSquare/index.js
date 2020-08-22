import './square.css';
import { FormattedMessage } from 'react-intl';
import H1 from 'components/H1';
import EjectLink from './EjectLink';
import PropTypes from 'prop-types';
import React from 'react';
import Input from './Input.js';

function FileUploadSquare(props) {
    return (
        <div className={props.isBgGreen ? 'square green' : 'square red'}>
            <div className="content">
                <div className="table">
                    <div className="table-cell">
                        <H1>
                            <FormattedMessage {...props.message} /> 
                        </H1>
                        <Input type="file" id="file1" onChange={props.fileHandler}/>
                        <EjectLink onClick={props.ejectHandler}>EJECT KEY</EjectLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

FileUploadSquare.propTypes = {
    isBgGreen: PropTypes.bool,
    fileHandler: PropTypes.func,
    message: PropTypes.object,
    ejectHandler: PropTypes.func,
};

export default FileUploadSquare;