import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "./auth.service";
import { Test, TestingModule } from "@nestjs/testing";
import { MailService } from "./mail.service";
import * as bcrypt from 'bcryptjs';

describe('AuthService',()=>{
    let service: AuthService;
    let prismaService: PrismaService
    let jwtService: JwtService
    let mailService: MailService

    const customerData ={
        customerId: '987654321',
        email:"test@gmail.com",
        fullname: "test01",
        phone:"0123456789",
        password: 'lem@19072006',
        point:0,
        rank:0
    }
    const staffData ={
        staffId: '987654321',
        email:"test@gmail.com",
        fullname: "test01",
        phone:"0123456789",
        password: 'lem@19072006',
        role: "staff"
     
    }
    const mockPrismaService={
        customer: {
            create: jest.fn().mockResolvedValue(customerData),
            findUnique: jest.fn()
        },
        staff:{
            create: jest.fn().mockResolvedValue(staffData),
            findUnique: jest.fn()
        }
    }
    const mockJWTService={
        sign:jest.fn()
    }
    
   jest.mock('bcryptjs', () => ({
        hash: jest.fn(),
        compare: jest.fn(),
        }));

    beforeEach(async()=>{
        const module: TestingModule = await Test.createTestingModule({
            providers: [
            AuthService,
            MailService,
            {
                provide: PrismaService,
                useValue: mockPrismaService
            },
            {
                provide: JwtService,
                useValue: mockJWTService
            }
        ]

        }).compile();
        
        service = module.get<AuthService>(AuthService)
        prismaService = module.get<PrismaService>(PrismaService)
        jwtService = module.get<JwtService>(JwtService)
        mailService = module.get<MailService>(MailService)
    });

    it("Shold be defined", ()=>{
        expect(service).toBeDefined();
        
    })
    describe("customer register API", ()=>{
        it("should register successfully and return user data", async ()=>{

        

            // 2. Set the return value on the mocked hash function

            const user  = await service.registerCustomer(customerData)
            expect({...user.user, password: customerData.password}).toEqual(customerData)


        })
    })
    describe("staff register API", ()=>{
        it("should register successfully and return user data", async ()=>{
            const user  = await service.registerStaff(staffData)
            expect({...user.user, password: staffData.password}).toEqual(staffData)
        })
    })
    
    describe("customer login API",()=>{
        it("should return user info",async ()=>{
        })
    })


})