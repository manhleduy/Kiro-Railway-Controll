import {io} from "socket.io-client"
const socket:any= io("http://localhost:8085",{
    autoConnect:false
});
export default socket;