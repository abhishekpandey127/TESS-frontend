import './CmrTable.scss';
import {DataGrid} from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GetAppIcon from '@mui/icons-material/GetApp';

const CmrTable = (props:any) => {
    const { dataSource,columns, idAlias, ...rest } = props;
    const columnsWAction =[...columns];

    return (
        <div style={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={(dataSource!=undefined)?dataSource.map((row:any) => ({ id: (idAlias!=undefined)? row[idAlias]:row['id'], ...row })):[]}
                columns={columnsWAction}
                checkboxSelection
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 50, page: 0 },
                    },
                }}
                {...rest}
            />
        </div>
    );
};

export default CmrTable;