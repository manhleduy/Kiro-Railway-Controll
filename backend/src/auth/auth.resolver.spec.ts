import { TestingModule, Test } from "@nestjs/testing"
import { AuthResolver } from "./auth.resolver"
import { AuthService } from "./auth.service"

describe("AuthResolver", ()=>{
    let resolver: AuthResolver
    let authService: AuthService

    const mockAuthService ={
        registerCustomer: jest.fn(),
        loginCustomer: jest.fn(),
        registerStaff: jest.fn(),
        loginStaff: jest.fn()
    }
    beforeEach(async()=>{
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthResolver,
                {
                    provide: AuthService,
                    useValue: mockAuthService
                }
            ],

        }).compile()

        resolver = module.get<AuthResolver>(AuthResolver)
        authService= module.get<AuthService>(AuthService)
        
    })
    it("should be difined", ()=>{
        expect(resolver).toBeDefined();
    })

})