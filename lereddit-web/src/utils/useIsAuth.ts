import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";


export const useIsAuth = () => {
    const [{data,fetching}] = useMeQuery();
    const router = useRouter();

    // console.log(router);

    useEffect(()=>{
        if (!fetching && !data?.me){
            // When we are not loading and user is authenticated(i.e returns result of meQuery)
            router.replace("/login?next=" + router.pathname);
        }
    },[fetching,data,router]);

}