type socketEventType = "seatStatusChange"
import { useEffect } from "react"
import toast from "react-hot-toast"
export const useListenSocket= <T>(
    socket: any, 
    emitEvent: socketEventType,
    callback: (data: T)=>void,
    notification?: string,
)=>{
    
    useEffect(()=>{
        socket.on(emitEvent, (data: T)=>{ 
            if(notification){
                toast(notification);
            }
            
            callback(data)
        })
        
    return ()=>{
        socket.off(emitEvent)
    }
    },[socket])   
}