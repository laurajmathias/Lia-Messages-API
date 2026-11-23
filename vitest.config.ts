import { defineConfig} from "vitest/config"; 
import { TEST_DATABASE_URL } from "./tests/test-env.ts";

export default defineConfig({
    test: {
        env: { DATABASE_URL: TEST_DATABASE_URL }, 
        globalSetup: ["./tests/global-setup.ts"], 
        fileParallelism: false, 
    },
}); 