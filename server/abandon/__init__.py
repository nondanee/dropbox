from . import index, signin, signup
from . import upload, ls, mkdir, rename, status, tree, recycle, preview, history
from . import remove_smash_recover, move_copy
from . import source, compress, frame
from . import test

def setup_routes(app):

    app.router.add_route("GET", "/", index.route)
    app.router.add_route("OPTIONS", "/test", test.route)
    app.router.add_route("POST", "/test", test.route)

    app.router.add_route("POST", "/signin", signin.route)
    app.router.add_route("POST", "/signup", signup.route)

    app.router.add_route("POST", "/upload", upload.route)
    app.router.add_route("OPTIONS", "/upload", upload.route)
    app.router.add_route("GET", "/list", ls.route) #referer
    app.router.add_route("GET", "/tree", tree.route)
    app.router.add_route("GET", "/recycle", recycle.route)
    app.router.add_route("POST", "/status", status.route)
    app.router.add_route("GET", "/preview", preview.route)
    app.router.add_route("GET", "/history", history.route)

    app.router.add_route("POST", "/makedir", mkdir.route)
    app.router.add_route("POST", "/rename", rename.route)

    app.router.add_route("POST", "/{action:move}", move_copy.route)
    app.router.add_route("POST", "/{action:copy}", move_copy.route)

    app.router.add_route("POST", "/{action:remove}", remove_smash_recover.route)
    app.router.add_route("POST", "/{action:smash}", remove_smash_recover.route)
    app.router.add_route("POST", "/{action:recover}", remove_smash_recover.route)

    app.router.add_route("POST", "/compress",compress.route) #referer

    app.router.add_route("GET", "/{action:source}/{filename:.+}",source.route)
    app.router.add_route("GET", "/{action:thumbnail}/{filename:.+}",source.route)
    app.router.add_route("GET", "/{action:download}/{filename:.+}",source.route)
    app.router.add_route("GET", "/{action:release}/{filename:.+}", source.route) #referer

    app.router.add_route("GET", "/{action:office}/{filename:.+}", frame.route)
    app.router.add_route("GET", "/{action:pdf}/{filename:.+}", frame.route)

