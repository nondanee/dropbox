from . import signin, signup
from . import upload, ls, mkdir, rename, status, tree
from . import remove_smash_recover, move_copy
from . import source, compress

def setup_routes(app):

    app.router.add_route("POST", "/signin", signin.route)
    app.router.add_route("POST", "/signup", signup.route)

    app.router.add_route("POST", "/upload", upload.route)
    app.router.add_route("GET", "/list", ls.route)
    app.router.add_route("GET", "/tree", tree.route)
    app.router.add_route("POST", "/status", status.route)

    app.router.add_route("POST", "/makedir", mkdir.route)
    app.router.add_route("POST", "/rename", rename.route)

    app.router.add_route("POST", "/{action:move}", move_copy.route)
    app.router.add_route("POST", "/{action:copy}", move_copy.route)

    app.router.add_route("POST", "/{action:remove}", remove_smash_recover.route)
    app.router.add_route("POST", "/{action:smash}", remove_smash_recover.route)
    app.router.add_route("POST", "/{action:recover}", remove_smash_recover.route)

    app.router.add_route("GET", "/{action:source}/{param:[a-z|A-Z|0-9]+}", source.route)
    app.router.add_route("GET", "/{action:preview}/{param:[a-z|A-Z|0-9]+}", source.route)
    app.router.add_route("GET", "/{action:thumbnail}/{type:list}/{param:[a-z|A-Z|0-9]+}", source.route)
    app.router.add_route("GET", "/{action:thumbnail}/{type:grid}/{param:[a-z|A-Z|0-9]+}", source.route)

    app.router.add_route("POST", "/compress",compress.route)
    # app.router.add_route("GET", "/release/{uid:\d{8}}/{md5:[a-z|0-9]{32}}.{extension}", release.route)
    app.router.add_route("GET", "/download/{filename:.+}",source.route)

