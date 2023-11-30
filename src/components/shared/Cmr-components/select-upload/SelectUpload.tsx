import React, {Fragment, useState} from "react";
import CMRUpload, {CMRUploadProps} from '../upload/Upload';
import {Alert, AlertTitle, Button, Collapse, MenuItem} from "@mui/material";
import Select, {SelectChangeEvent} from "@mui/material/Select";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import {UploadedFile} from "../../../../redux/slices/home/homeSlice";
import {AxiosResponse} from "axios";

interface CMRSelectUploadProps extends CMRUploadProps{
    /**
     * A selection of currently uploaded files
     */
    fileSelection: UploadedFile[];
    onSelected: (file: UploadedFile)=>void;
    chosenFile?: string;
}

/**
 * Select from a set of uploaded files or upload new
 */
const CMRSelectUpload = (props: CMRSelectUploadProps) => {

    let [open, setOpen] = React.useState(false);
    let [fileIndex, selectFileIndex] = React.useState(0);
    let [chosenFile, setChosenFile] = React.useState<string|undefined>(props.chosenFile);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (event: SelectChangeEvent<number>) => {
        //@ts-ignore
        selectFileIndex(event.target.value);
    };

    const onSet = ()=>{
        props.onSelected(props.fileSelection[fileIndex]);
        setChosenFile(props.fileSelection[fileIndex].fileName);
        setOpen(false);
    }


    const selectionDialog =  <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Upload or select</DialogTitle>
        <DialogContent sx={{width: 'fit-content'}}>
            <DialogContentText>
                Upload a new file or from previously uploaded files.
            </DialogContentText>
            <DialogContent>
                <Select
                    value={fileIndex}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    sx={{width: '100%'}}
                >
                    {((props.fileSelection!=undefined? props.fileSelection: [])).map((option,index) => (
                        <MenuItem key={index} value={index}>
                            {option.fileName}
                        </MenuItem>
                    ))}
                </Select>
            </DialogContent>
            <DialogActions>
                <CMRUpload {...props} onUploaded={(res,file)=>{
                    props.onUploaded(res,file);
                    console.log(file.name);
                    setChosenFile(file.name);
                    setOpen(false);
                }}
                ></CMRUpload>
                <Button variant="text" disabled={true}>
                    Or
                </Button>
                <Button variant="contained" color="success" onClick={onSet}>
                    Select
                </Button>
            </DialogActions>
        </DialogContent>
    </Dialog>;
    return <Fragment>
        <Button variant={(chosenFile==undefined)?"contained":"outlined"} color="info" onClick={handleClickOpen} sx={{marginRight:'10pt'}}>
            {(chosenFile==undefined)?"Choose":chosenFile}
        </Button>
        {selectionDialog}
    </Fragment>;
};

export default CMRSelectUpload;