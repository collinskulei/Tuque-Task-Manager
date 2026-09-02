import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "./actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const notice = typeof searchParams.notice === "string" ? searchParams.notice : null;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Tuque Task Manager</h1>
          <p className="mt-1 text-sm text-foreground-muted">Sign in to your workspace</p>
        </div>

        <form className="flex flex-col gap-3" action={signIn}>
          <Input type="email" name="email" placeholder="Email" required autoFocus />
          <Input type="password" name="password" placeholder="Password" required minLength={6} />

          {error && <p className="text-sm text-danger">{error}</p>}
          {notice && <p className="text-sm text-foreground-muted">{notice}</p>}

          <Button type="submit" className="mt-1 w-full">
            Sign in
          </Button>
          <Button type="submit" formAction={signUp} variant="secondary" className="w-full">
            Create account
          </Button>
        </form>

        <details className="mt-6 rounded-md border border-border">
          <summary className="cursor-pointer select-none px-3 py-2 text-sm text-foreground-muted hover:text-foreground">
            Demo credentials
          </summary>
          <div className="border-t border-border px-3 py-2 text-sm text-foreground-muted">
            <p>
              Email: <span className="text-foreground">admin@iacentre.co.ke</span>
            </p>
            <p>
              Password: <span className="text-foreground">DemoAdmin</span>
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
