import { Box, Button, Flex, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';


interface NavBarProps{

}


const NavBar: React.FC<NavBarProps> = ({})=>{

    const [{fetching: logoutFetching},logout] = useLogoutMutation();

    const [{data,fetching}] = useMeQuery({
        pause: isServer(),
    });

    // console.log("data:",data);

    /* We actually have three states
        if we are loading , if the user is logged in, if the user is not logged in
    */


    let body = null;

    // Data is loading
    if(fetching){
        body = null;
    } else if(!data?.me){ // user not logged in
        body = (
            <>
            <NextLink href="/login">
                    <Link mr={2}>Login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link mr={2}>Register</Link>
                </NextLink>
            </>
        )
    }else { // user is logged in
        body = (
            <Flex>
                 <Box mr={2}>{data.me.username}</Box>
                 <Button onClick={() => {
                     logout();
                 }} isLoading={logoutFetching} variant='link'>Logout</Button>
            </Flex>
           
        )
    }

    return (
        <Flex zIndex={1} position='sticky' top={0} bg='tan' p={4}>
            <Box ml={'auto'}>
                {body}
            </Box>
        </Flex>
    );
    
    
}

export default NavBar;