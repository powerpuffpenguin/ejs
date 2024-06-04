set_license("GPL-2.0")
add_rules("mode.debug", "mode.release")
add_rules("plugin.compile_commands.autoupdate", { outputdir = ".vscode" })

set_languages("c99")

add_requires("libevent ~2.1.12")


add_repositories("local-repo third_party_repo")
-- add_requires("wolfssl ~5.6.6")


plat=get_config("plat")
arch=get_config("arch")

target("ejs")
    set_kind("static")
    add_files("src/duk/*.c")
    add_files("src/ejs/*.c")
    add_files("src/ejs/internal/*.c")
    add_files("src/main.c")
    if not is_arch("x86_64") then
        add_ldflags("-static", {force = true})
    end
     if is_mode("debug") then
        add_defines("DEBUG")
    end
    if plat ~= nil then 
        add_defines('EJS_CONFIG_OS="'..plat..'", '..plat:len())
    end
        if arch ~= nil then 
        add_defines('EJS_CONFIG_ARCH="'..arch..'", '..arch:len())
    end
    add_defines("_XOPEN_SOURCE=700")
    add_defines("_DEFAULT_SOURCE")
     add_defines("_SVID_SOURCE")
    add_syslinks("pthread")
    add_packages("libevent")

target("example_ejs")
    set_kind("binary")
    set_basename("ejs")
    add_files("src/main.c")
     if is_mode("debug") then
        add_defines("DEBUG")
    end
    add_packages("libevent")
    add_deps("ejs")

target("ejs_test")
    set_kind("binary")
    add_files("src/duk/*.c")
    add_files("src/ejs/*.c")
    add_files("src/ejs/internal/*.c")
    add_files("src/ejs_test/*.c")
    add_files("src/cutest/CuTest.c")
    add_files("src/main_test.c")
    if not is_arch("x86_64") then
        add_ldflags("-static", {force = true})
    end
     if is_mode("debug") then
        add_defines("DEBUG")
    end
    if plat ~= nil then 
        add_defines('EJS_CONFIG_OS="'..plat..'", '..plat:len())
    end
        if arch ~= nil then 
        add_defines('EJS_CONFIG_ARCH="'..arch..'", '..arch:len())
    end
    add_defines("_XOPEN_SOURCE=700")
    add_defines("_DEFAULT_SOURCE")
    add_defines("_SVID_SOURCE")
    add_syslinks("pthread")
    add_packages("libevent")

--
-- If you want to known more usage about xmake, please see https://xmake.io
--
-- ## FAQ
--
-- You can enter the project directory firstly before building project.
--
--   $ cd projectdir
--
-- 1. How to build project?
--
--   $ xmake
--
-- 2. How to configure project?
--
--   $ xmake f -p [macosx|linux|iphoneos ..] -a [x86_64|i386|arm64 ..] -m [debug|release]
--
-- 3. Where is the build output directory?
--
--   The default output directory is `./build` and you can configure the output directory.
--
--   $ xmake f -o outputdir
--   $ xmake
--
-- 4. How to run and debug target after building project?
--
--   $ xmake run [targetname]
--   $ xmake run -d [targetname]
--
-- 5. How to install target to the system directory or other output directory?
--
--   $ xmake install
--   $ xmake install -o installdir
--
-- 6. Add some frequently-used compilation flags in xmake.lua
--
-- @code
--    -- add debug and release modes
--    add_rules("mode.debug", "mode.release")
--
--    -- add macro definition
--    add_defines("NDEBUG", "_GNU_SOURCE=1")
--
--    -- set warning all as error
--    set_warnings("all", "error")
--
--    -- set language: c99, c++11
--    set_languages("c99", "c++11")
--
--    -- set optimization: none, faster, fastest, smallest
--    set_optimize("fastest")
--
--    -- add include search directories
--    add_includedirs("/usr/include", "/usr/local/include")
--
--    -- add link libraries and search directories
--    add_links("tbox")
--    add_linkdirs("/usr/local/lib", "/usr/lib")
--
--    -- add system link libraries
--    add_syslinks("z", "pthread")
--
--    -- add compilation and link flags
--    add_cxflags("-stdnolib", "-fno-strict-aliasing")
--    add_ldflags("-L/usr/local/lib", "-lpthread", {force = true})
--
-- @endcode
--

