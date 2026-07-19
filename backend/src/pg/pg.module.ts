import { Module } from "@nestjs/common";
import { SeatsGateway } from "../seats/seat.gateway";
import { PgListenerService } from "./pg.listener.service";

@Module({
    providers:[PgListenerService, SeatsGateway],
    exports: [PgListenerService],
    imports: [SeatsGateway]

})
export class PgModule{}