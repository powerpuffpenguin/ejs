package("libtomcrypt")
    set_homepage("https://www.libtom.net")
    set_description("A fairly comprehensive, modular and portable cryptographic toolkit.")
    set_license("Unlicense")

    local zip_url = "https://github.com/libtom/libtomcrypt/releases/download/v$(version)/crypt-$(version).zip"
    add_urls(zip_url)

    on_install(function (package)
        local zip_file = path.basename(zip_url)
        local source_dir = package:sourcedir()

        os.vrun("curl -LJO %s", zip_url)
        os.vrun("unzip %s -d %s", zip_file, source_dir)

        local envs = {
            CC = package:build_getenv("cc"),
            CXX = package:build_getenv("cxx"),
            AR = package:build_getenv("ar"),
            LD = package:build_getenv("ld"),
        }

        local  cflags = {"-DLTC_NO_TEST"}
        if package:config("pic") then
            table.insert(cflags, "-fPIC")
        end

        local makefile
        if package:config("shared") then
            makefile="--file=makefile.shared"
        else 
            makefile="--file=makefile"
        end
        local configs = {makefile}

        table.insert(configs, "CFLAGS=" .. table.concat(cflags, " "))

        os.execv("make", configs, { envs = envs})
        os.execv("make", {makefile,"install", "PREFIX=" .. package:installdir()})
    end)
