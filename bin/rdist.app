##
## RDIST Image Class web dir to production
## This script is specifically for /l1/web/c/coll 

# usage: 
# rdist -m dlps9.umdl.umich.edu -d INSTANCE=c/coll -f rdist.imageclass-webdir
# wrapper script: rdist -s image -d INSTANCE=c/coll -f rdist.imageclass-webdir

# Destination Production Servers
#
VALUESTORE    = ( quod-update.umdl.umich.edu )

HOSTS = ( ${VALUESTORE} )

# INSTANCE var must be set on command line
# e.g., -d INSTANCE=c/coll
INSTANCE = ( e/epistles )

# File Directories to be released (source)

WEB_src = ( /l1/web/${INSTANCE} )

# File Directories to be released (destination)

WEB_dest = ( /l1/web/${INSTANCE} )

( ${WEB_src} ) -> ( ${HOSTS} )
        install -oremove ${WEB_dest};
        except_pat ( ~ .git node_modules src );
        # notify dlps-imageclass-notify@umich.edu ;
        notify roger@umich.edu ;

